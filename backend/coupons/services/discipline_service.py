from ..models import Discipline


def get_or_create_discipline(code, name, category=None):
    code = code.upper()
    defaults = {'name': name}
    if category:
        defaults['category'] = category
    obj, created = Discipline.objects.get_or_create(code=code, defaults=defaults)
    return obj, created
