//
//  ARViewController.h
//  UIWebViewWebGL
//
//  Created by Samuel Lüscher on 4/17/12.
//  Copyright (c) 2012 Nathan de Vries. All rights reserved.
//

#import <UIKit/UIKit.h>
#import "MBProgressHUD.h"

@interface ARViewController : UIViewController <UIWebViewDelegate, UITableViewDelegate, UITableViewDataSource, UIGestureRecognizerDelegate> {
  IBOutlet UIWebView *webView;
  IBOutlet UITextField *urlField;
  IBOutlet UITableView *urlHistory;
  IBOutlet UIToolbar *urlBar;
  IBOutlet UIView *tapView, *progressView;
  NSMutableArray *urls;
  MBProgressHUD *hud;
}

@property (nonatomic, retain) UIWebView *webView;
- (IBAction)reloadUrl;
- (IBAction)urlEntered;
- (IBAction)beginUrlEditing;
- (IBAction)endUrlEditing;
- (void)loadUrl:(NSString *)url addToHistory:(bool)addToHistory;

@end
