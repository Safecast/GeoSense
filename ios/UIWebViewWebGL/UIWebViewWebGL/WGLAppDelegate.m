//
//  WGLAppDelegate.m
//  UIWebViewWebGL
//
//  Created by Nathan de Vries on 27/10/11.
//  Copyright (c) 2011 Nathan de Vries. All rights reserved.
//

#import "WGLAppDelegate.h"
#import "CameraViewController.h"

@implementation WGLAppDelegate

@synthesize window=_window;

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
  self.window = [[[UIWindow alloc] initWithFrame:[[UIScreen mainScreen] bounds]] autorelease];
      
  UIWebView* webView = [[[UIWebView alloc] initWithFrame:self.window.bounds] autorelease];
  webView.backgroundColor = [UIColor clearColor];
  webView.opaque = NO;
  
  id webDocumentView = [webView performSelector:@selector(_browserView)];
  id backingWebView = [webDocumentView performSelector:@selector(webView)];
  [backingWebView _setWebGLEnabled:YES];

  
  NSString *url = @"http://sam-macbookair.media.mit.edu:8124";
  //NSString *url = @"http://localhost:8124/globe";
  //NSString *url = @"http://18.189.34.8:8124/globe";
  NSURLRequest* request = [NSURLRequest requestWithURL:[NSURL URLWithString:url]];
  [webView loadRequest:request];
  
  CameraViewController *viewController = [[CameraViewController alloc] init];
  
  /*
  UIViewController* viewController = [[[UIViewController alloc] init] autorelease];
  UIView* view = [[UIView alloc] initWithFrame:webView.frame];

  UIImageView* imageView = [[UIImageView alloc] initWithFrame:webView.frame];
  imageView.image = [UIImage imageNamed:@"Palm_Beach.jpeg"];
  
  [view addSubview:imageView];
  //[view addSubview:webView];
  viewController.view = view;
   */
   
  self.window.rootViewController = viewController;
  [self.window makeKeyAndVisible];
  
  [viewController initCamera];
  viewController.imagePicker.cameraOverlayView = webView;
  
   
  return YES;
}

@end
