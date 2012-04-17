//
//  ARViewController.m
//  UIWebViewWebGL
//
//  Created by Samuel Lüscher on 4/17/12.
//  Copyright (c) 2012 Nathan de Vries. All rights reserved.
//

#import "ARViewController.h"

@interface ARViewController ()

@end

@implementation ARViewController

@synthesize webView;

- (id)initWithNibName:(NSString *)nibNameOrNil bundle:(NSBundle *)nibBundleOrNil
{
    self = [super initWithNibName:nibNameOrNil bundle:nibBundleOrNil];
    if (self) {
        // Custom initialization
    }
    return self;
}

- (void)viewDidLoad
{
    [super viewDidLoad];
    webView.backgroundColor = [UIColor clearColor];
    webView.opaque = NO;

    id webDocumentView = [webView performSelector:@selector(_browserView)];
    id backingWebView = [webDocumentView performSelector:@selector(webView)];
    [backingWebView _setWebGLEnabled:YES];  
    [self reloadUrl];
}

- (void)reloadUrl 
{
    [self.webView becomeFirstResponder]; 
    NSString *url = urlField.text;
    NSURLRequest* request = [NSURLRequest requestWithURL:[NSURL URLWithString:url]];
    [webView loadRequest:request];
}

- (void)viewDidUnload
{
    [super viewDidUnload];
    // Release any retained subviews of the main view.
}

- (BOOL)shouldAutorotateToInterfaceOrientation:(UIInterfaceOrientation)interfaceOrientation
{
	return YES;
}

@end
