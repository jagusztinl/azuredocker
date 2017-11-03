from .models import File

def handle_file(file):
    fileModel = File(
        name=file.name,
        data=file.read(),
        size=file.size,
    )
    fileModel.save()
    return dict(
        size=file.size,
        name=file.name,
    )
