from django.contrib import admin
from django.urls import path
from raceapp import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.typing, name='typing'),
    path('new-sentence/', views.new_sentence, name='new_sentence'),
]