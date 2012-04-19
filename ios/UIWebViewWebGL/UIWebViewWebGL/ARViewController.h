//
//  ARViewController.h
//  UIWebViewWebGL
//
//  Created by Samuel Lüscher on 4/17/12.
//  Copyright (c) 2012 Nathan de Vries. All rights reserved.
//

#import <UIKit/UIKit.h>

@interface ARViewController : UIViewController <UIWebViewDelegate, UITableViewDelegate> {
  IBOutlet UIWebView *webView;
  IBOutlet UITextField *urlField;
  IBOutlet UIBarButtonItem *reloadButton;

}

@property (nonatomic, retain) UIWebView *webView;
- (IBAction)reloadUrl;

@end
