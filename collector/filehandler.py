from .models import File

def save_file(file):
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

def delete_file(id_):
    file = File.objects.filter(id=id_).first()
    if file:
        file.delete()
        return True
    return False

