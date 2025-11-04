from django.db import migrations
class Migration(migrations.Migration):

    dependencies = [
        ('coupons', '0005_alter_bet_event'),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
                ALTER TABLE coupons_bet
                DROP CONSTRAINT coupons_bet_coupon_id_ce9b3816_fk_coupons_coupon_id;
                
                ALTER TABLE coupons_bet
                ADD CONSTRAINT coupons_bet_coupon_id_ce9b3816_fk_coupons_coupon_id
                FOREIGN KEY (coupon_id) REFERENCES coupons_coupon(id) ON DELETE CASCADE;
            """,
            reverse_sql="""
                ALTER TABLE coupons_bet
                DROP CONSTRAINT coupons_bet_coupon_id_ce9b3816_fk_coupons_coupon_id;
                
                ALTER TABLE coupons_bet
                ADD CONSTRAINT coupons_bet_coupon_id_ce9b3816_fk_coupons_coupon_id
                FOREIGN KEY (coupon_id) REFERENCES coupons_coupon(id) ON DELETE RESTRICT;
            """,
        ),
    ]

