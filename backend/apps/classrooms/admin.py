from django.contrib import admin

from .models import Classroom, ClassroomMembership

admin.site.register(Classroom)
admin.site.register(ClassroomMembership)
