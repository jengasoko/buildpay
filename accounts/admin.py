from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User


# Register your models here.
@admin.register(User)
class CustomerUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ('Addition Info', {'fields': ('role', 'phone')}),
    )
