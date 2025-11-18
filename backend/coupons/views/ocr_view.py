import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from pathlib import Path
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from coupons.services.ocr_service import OCRService
from coupons.services.coupon_parser_v2 import CouponParser

logger = logging.getLogger(__name__)


class OCRTestView(APIView):

    @swagger_auto_schema(
        operation_summary='List available OCR test images',
        operation_description='Get list of available images for OCR testing',
        responses={
            200: openapi.Response('List of available images'),
            404: openapi.Response('Images directory not found'),
            500: openapi.Response('Server error'),
        }
    )
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
    
    @swagger_auto_schema(
        operation_summary='Extract text from image using OCR',
        operation_description='Extract text from coupon image using PaddleOCR, optionally parse it',
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'image_name': openapi.Schema(type=openapi.TYPE_STRING, description='Image filename'),
                'parse': openapi.Schema(type=openapi.TYPE_BOOLEAN, default=False, description='Parse extracted text'),
                'bookmaker_account': openapi.Schema(type=openapi.TYPE_INTEGER, default=1, description='Bookmaker account ID'),
            },
            required=['image_name']
        ),
        responses={
            200: openapi.Response('OCR extraction result'),
            400: openapi.Response('Bad request'),
            404: openapi.Response('Image not found'),
            500: openapi.Response('Server error'),
        }
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


class OCRParseView(APIView):

    @swagger_auto_schema(
        operation_summary='Parse coupon from image',
        operation_description='Extract and parse coupon data from image',
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'image_name': openapi.Schema(type=openapi.TYPE_STRING, description='Image filename'),
                'bookmaker_account': openapi.Schema(type=openapi.TYPE_INTEGER, default=1, description='Bookmaker account ID'),
            },
            required=['image_name']
        ),
        responses={
            200: openapi.Response('Parsed coupon data'),
            400: openapi.Response('Bad request'),
            404: openapi.Response('Image not found'),
            500: openapi.Response('Server error'),
        }
    )
    def post(self, request, *args, **kwargs):
        try:
            image_name = request.data.get('image_name')
            bookmaker_account = request.data.get('bookmaker_account', 1)

            if not image_name:
                return Response({'error': 'image_name is required'}, status=status.HTTP_400_BAD_REQUEST)

            images_dir = Path(__file__).parent.parent.parent / 'coupons_images'
            image_path = images_dir / image_name

            if not image_path.exists():
                return Response(
                    {'error': f'Image not found: {image_name}', 'expected_path': str(image_path)},
                    status=status.HTTP_404_NOT_FOUND
                )

            ocr_service = OCRService(backend='paddle')
            extracted_text = ocr_service.extract_text_from_image(image_path)
            parser = CouponParser()
            coupon = parser.parse(extracted_text, bookmaker_account=int(bookmaker_account))

            return Response(coupon.to_dict(), status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error processing image: {str(e)}", exc_info=True)
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
