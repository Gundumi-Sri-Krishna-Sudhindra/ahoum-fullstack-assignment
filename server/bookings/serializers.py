from rest_framework import serializers

from sessions.serializers import CreatorSummarySerializer
from .models import Booking


class BookingSessionSummarySerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    title = serializers.CharField(read_only=True)
    description = serializers.CharField(read_only=True)
    start_time = serializers.DateTimeField(read_only=True)
    end_time = serializers.DateTimeField(read_only=True)
    capacity = serializers.IntegerField(read_only=True)
    creator = CreatorSummarySerializer(read_only=True)
    is_past = serializers.BooleanField(read_only=True)


class BookingSerializer(serializers.ModelSerializer):
    session = BookingSessionSummarySerializer(read_only=True)
    is_past = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = (
            'id',
            'session',
            'status',
            'created_at',
            'updated_at',
            'is_past',
        )
        read_only_fields = fields

    def get_is_past(self, obj):
        return obj.session.is_past
