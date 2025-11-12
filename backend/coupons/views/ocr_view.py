import logging
import json
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from pathlib import Path
from coupons.services.ocr_service import OCRService
from coupons.services.coupon_parser_v2 import CouponParser

logger = logging.getLogger(__name__)


class OCRTestView(APIView):
    def get(self, request, *args, **kwargs):
        try:
            images_dir = Path(__file__).parent.parent.parent / 'coupons_images'
            
            if not images_dir.exists():
                return Response(
                    {
                        'success': False,
                        'error': f'Directory not found: {images_dir}',
                        'images': []
                    },
                    status=status.HTTP_404_NOT_FOUND
                )

            image_extensions = ['.png', '.jpg', '.jpeg', '.bmp', '.gif']
            images = [
                img.name for img in images_dir.iterdir()
                if img.suffix.lower() in image_extensions
            ]
            
            return Response({
                'success': True,
                'images_dir': str(images_dir),
                'available_images': images,
                'count': len(images)
            })
            
        except Exception as e:
            logger.error(f"Error listing images: {str(e)}")
            return Response(
                {'success': False, 'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def post(self, request, *args, **kwargs):
        try:
            image_name = request.data.get('image_name')
            should_parse = request.data.get('parse', False)
            bookmaker_account = request.data.get('bookmaker_account', 1)

            if not image_name:
                return Response(
                    {'success': False, 'error': 'image_name is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            images_dir = Path(__file__).parent.parent.parent / 'coupons_images'
            image_path = images_dir / image_name
            
            if not image_path.exists():
                return Response(
                    {
                        'success': False,
                        'error': f'Image not found: {image_name}',
                        'expected_path': str(image_path)
                    },
                    status=status.HTTP_404_NOT_FOUND
                )
            
            logger.info(f"Initializing PaddleOCR for image: {image_name}")
            ocr_service = OCRService(backend='paddle')

            logger.info(f"Extracting text from: {image_path}")
            extracted_text = ocr_service.extract_text_from_image(image_path)
            result_with_confidence = ocr_service.extract_text_with_confidence(image_path)
            
            if not should_parse:
                return Response({
                    'success': True,
                    'image_name': image_name,
                    'image_path': str(image_path),
                    'raw_text': extracted_text,
                    'detailed_result': result_with_confidence
                })

            logger.info(f"Parsing coupon from extracted text")
            parser = CouponParser()
            coupon = parser.parse(extracted_text, bookmaker_account=int(bookmaker_account))

            return Response({
                'success': True,
                'image_name': image_name,
                'image_path': str(image_path),
                'raw_text': extracted_text,
                'ocr_details': result_with_confidence,
                'parsed_coupon': coupon.to_dict()
            })

        except Exception as e:
            logger.error(f"Error processing image: {str(e)}", exc_info=True)
            return Response(
                {'success': False, 'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

