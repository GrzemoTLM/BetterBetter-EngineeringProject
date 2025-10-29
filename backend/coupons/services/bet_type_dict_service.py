from ..models import BetTypeDict


def get_or_create_bet_type(code, description):
    code = code.upper()
    obj, created = BetTypeDict.objects.get_or_create(code=code, defaults={'description': description})
    return obj, created
