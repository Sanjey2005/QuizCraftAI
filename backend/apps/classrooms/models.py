import random
import string
import uuid

from django.db import models

from apps.users.models import User


class Classroom(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    teacher = models.ForeignKey(User, on_delete=models.CASCADE, related_name="classrooms")
    code = models.CharField(max_length=6, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    def save(self, *args, **kwargs):
        if not self.code:
            self.code = self.generate_code()
        super().save(*args, **kwargs)

    @staticmethod
    def generate_code():
        while True:
            code = "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
            if not Classroom.objects.filter(code=code).exists():
                return code

    def __str__(self):
        return self.name


class ClassroomMembership(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    classroom = models.ForeignKey(Classroom, on_delete=models.CASCADE, related_name="memberships")
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name="memberships")
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["classroom", "student"], name="unique_membership"),
        ]

    def __str__(self):
        return f"{self.student.username} in {self.classroom.name}"
