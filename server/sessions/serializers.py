from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import serializers

from .models import Session

User = get_user_model()


class CreatorSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'name', 'email')
        read_only_fields = fields


class SessionSerializer(serializers.ModelSerializer):
    creator = CreatorSummarySerializer(read_only=True)
    booking_count = serializers.IntegerField(source='active_booking_count', read_only=True)
    remaining_seats = serializers.IntegerField(read_only=True)
    is_past = serializers.BooleanField(read_only=True)

    class Meta:
        model = Session
        fields = (
            'id',
            'creator',
            'title',
            'description',
            'start_time',
            'end_time',
            'capacity',
            'booking_count',
            'remaining_seats',
            'is_past',
            'created_at',
            'updated_at',
        )
        read_only_fields = (
            'id',
            'creator',
            'booking_count',
            'remaining_seats',
            'is_past',
            'created_at',
            'updated_at',
        )


class SessionCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Session
        fields = (
            'id',
            'title',
            'description',
            'start_time',
            'end_time',
            'capacity',
        )

    def validate_capacity(self, value):
        if value <= 0:
            raise serializers.ValidationError("Capacity must be greater than 0.")
        return value

    def validate(self, attrs):
        start_time = attrs.get('start_time') or (self.instance.start_time if self.instance else None)
        end_time = attrs.get('end_time') or (self.instance.end_time if self.instance else None)

        # On create, start_time must be in the future
        if not self.instance and start_time and start_time <= timezone.now():
            raise serializers.ValidationError({"start_time": "Session start time must be in the future."})

        if start_time and end_time and end_time <= start_time:
            raise serializers.ValidationError({"end_time": "Session end time must be after start time."})

        # On update, verify new capacity is not less than already booked active seats
        if self.instance and 'capacity' in attrs:
            new_capacity = attrs['capacity']
            active_bookings = self.instance.active_booking_count
            if new_capacity < active_bookings:
                raise serializers.ValidationError(
                    {"capacity": f"Cannot reduce capacity to {new_capacity}. There are already {active_bookings} active bookings."}
                )

        return attrs

    def create(self, validated_data):
        validated_data['creator'] = self.context['request'].user
        return super().create(validated_data)


class SessionAttendeeBookingSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    user = CreatorSummarySerializer(read_only=True)
    status = serializers.CharField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)


class CreatorSessionDetailSerializer(SessionSerializer):
    attendees = serializers.SerializerMethodField()

    class Meta(SessionSerializer.Meta):
        fields = SessionSerializer.Meta.fields + ('attendees',)

    def get_attendees(self, obj):
        active_bookings = obj.bookings.filter(status='ACTIVE').select_related('user')
        return SessionAttendeeBookingSerializer(active_bookings, many=True).data
