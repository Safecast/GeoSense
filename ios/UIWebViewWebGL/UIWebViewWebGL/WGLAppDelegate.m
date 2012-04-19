//
//  WGLAppDelegate.m
//  UIWebViewWebGL
//
//  Created by Nathan de Vries on 27/10/11.
//  Copyright (c) 2011 Nathan de Vries. All rights reserved.
//

#import "WGLAppDelegate.h"
#import "CameraViewController.h"
#import "ARViewController.h"

@implementation WGLAppDelegate

@synthesize window=_window;

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
  self.window = [[[UIWindow alloc] initWithFrame:[[UIScreen mainScreen] bounds]] autorelease];
  
  CameraViewController *cameraViewController = [[CameraViewController alloc] init];
  ARViewController *overlayViewController = [[ARViewController alloc] initWithNibName:@"ARViewController" bundle:nil];
  
  /*
  UIViewController* viewController = [[[UIViewController alloc] init] autorelease];
  UIView* view = [[UIView alloc] initWithFrame:webView.frame];

  UIImageView* imageView = [[UIImageView alloc] initWithFrame:webView.frame];
  imageView.image = [UIImage imageNamed:@"Palm_Beach.jpeg"];
  
  [view addSubview:imageView];
  //[view addSubview:webView];
  viewController.view = view;
   */

  self.window.rootViewController = cameraViewController;
  [self.window makeKeyAndVisible];
  
  if ([cameraViewController initCamera]) {
    cameraViewController.imagePicker.cameraOverlayView = overlayViewController.view;
  } else {
    [cameraViewController.view addSubview:overlayViewController.view];
  }
  
   
  return YES;
}

@end
