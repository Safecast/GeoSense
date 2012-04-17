#import <UIKit/UIKit.h>
#import <MobileCoreServices/MobileCoreServices.h>

@interface CameraViewController : UIViewController
<UIImagePickerControllerDelegate,
UINavigationControllerDelegate, UIPopoverControllerDelegate>
{
  UIToolbar *toolbar;
  UIPopoverController *popoverController;
  UIImageView *imageView;
  UIImagePickerController *imagePicker;
}

- (void)initCamera;
@property (nonatomic, retain) UIImagePickerController *imagePicker;

@end