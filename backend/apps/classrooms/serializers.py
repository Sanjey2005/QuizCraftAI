from rest_framework import serializers

from .models import Classroom, ClassroomMembership


class MemberSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="student.username", read_only=True)

    class Meta:
        model = ClassroomMembership
        fields = ["id", "username", "joined_at"]


class ClassroomSerializer(serializers.ModelSerializer):
    teacher_username = serializers.CharField(source="teacher.username", read_only=True)
    member_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Classroom
        fields = ["id", "name", "description", "code", "teacher_username", "member_count", "created_at", "is_active"]
        read_only_fields = ["id", "code", "teacher_username", "member_count", "created_at"]


class ClassroomDetailSerializer(serializers.ModelSerializer):
    teacher_username = serializers.CharField(source="teacher.username", read_only=True)
    member_count = serializers.IntegerField(read_only=True)
    members = MemberSerializer(source="memberships", many=True, read_only=True)

    class Meta:
        model = Classroom
        fields = ["id", "name", "description", "code", "teacher_username", "member_count", "members", "created_at", "is_active"]
        read_only_fields = ["id", "code", "teacher_username", "member_count", "members", "created_at"]


class JoinClassroomSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=6)
