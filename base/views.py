from django.shortcuts import render


# Hello World
def homepage(request):
    return render(request, 'base/homepage.html',)

