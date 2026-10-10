import random
from django.shortcuts import render
from django.http import JsonResponse

SUBJECTS = ["The driver", "A clever robot", "My best friend", "The young racer", "A fast student", "The little dog", "The teacher", "A happy player"]
VERBS = ["drives", "runs", "jumps", "learns", "builds", "explores", "races", "practices"]
OBJECTS = ["through the city", "on a sunny morning", "to the finish line", "with great speed", "near the green park", "before the final round", "along the open road", "with a bright smile"]


def generate_sentence():
    """Build a new sentence from word lists instead of choosing a hard-coded sentence."""
    words = [random.choice(SUBJECTS), random.choice(VERBS), random.choice(OBJECTS)]
    return " ".join(words) + "."


def typing(request):
    return render(request, "race.html", {"sentence": generate_sentence()})


def new_sentence(request):
    return JsonResponse({"sentence": generate_sentence()})
