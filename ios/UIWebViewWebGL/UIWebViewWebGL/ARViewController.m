//
//  ARViewController.m
//  UIWebViewWebGL
//
//  Created by Samuel Lüscher on 4/17/12.
//  Copyright (c) 2012 Nathan de Vries. All rights reserved.
//

#import "ARViewController.h"
#import "WGLAppDelegate.h"


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
  webView.scrollView.scrollEnabled = NO; 
  webView.scrollView.bounces = NO;

  id webDocumentView = [webView performSelector:@selector(_browserView)];
  id backingWebView = [webDocumentView performSelector:@selector(webView)];

  urlHistory.hidden = YES;

  hud = [[MBProgressHUD alloc] initWithView:webView];
  hud.animationType = MBProgressHUDAnimationFade;
  hud.opacity = .5;
  [self.view addSubview:hud];
  
  urls = [[NSMutableArray alloc] init];

  [backingWebView _setWebGLEnabled:YES];  

  [self loadUrl:@"http://18.189.34.8:8124/toLpaWT1900dmxm/globe/?lens_tag=1" addToHistory:YES];

  UITapGestureRecognizer *tapRecognizer = [[UITapGestureRecognizer alloc] initWithTarget:self action:@selector(showUrlBar:)];
	[tapRecognizer setNumberOfTapsRequired:3];
	[tapRecognizer setDelegate:self];
  WGLAppDelegate *appDelegate = (WGLAppDelegate *)[[UIApplication sharedApplication] delegate];

	[appDelegate.window addGestureRecognizer:tapRecognizer];  
}

- (IBAction)reloadUrl 
{
  [self loadUrl:[webView.request.URL absoluteString] addToHistory:NO];
}

- (void)loadUrl:(NSString *)url addToHistory:(bool)addToHistory {
  urlBar.hidden = YES;
  [urlField resignFirstResponder]; 
  //urlBar.hidden = YES;
  urlField.text = url;
 
  NSURLRequest* request = [NSURLRequest requestWithURL:[NSURL URLWithString:url] cachePolicy:NSURLCacheStorageNotAllowed timeoutInterval:10];
  webView.hidden = YES;
  [webView loadRequest:request];
  
  NSLog(@"load url %@", url);
  
  if (addToHistory) {
    if (![urls containsObject:[NSString stringWithString:url]]) {
      [urls addObject:url];
      [urlHistory reloadData];
    }
  }
}

- (IBAction)urlEntered {
  NSLog(@"add to history: %@", urlField.text);
  [self loadUrl:urlField.text addToHistory:YES];
}

- (void)webViewDidStartLoad:(UIWebView *)webView {
  [hud show:YES];
}  

- (void)webViewDidFinishLoad:(UIWebView *)webView {
  urlField.text = [webView.request.URL absoluteString];
  [hud hide:YES];
  webView.hidden = NO;
  NSLog(@"webViewDidFinishLoad");
}

- (IBAction)beginUrlEditing {
  urlHistory.hidden = NO;
  [hud hide:YES];
}

- (IBAction)endUrlEditing {
  urlBar.hidden = YES;
  urlHistory.hidden = YES;
  [urlField resignFirstResponder]; 
}

- (void)tableView:(UITableView *)tableView didSelectRowAtIndexPath:(NSIndexPath *)indexPath {
  [tableView deselectRowAtIndexPath:indexPath animated:NO];
  [self loadUrl:[urls objectAtIndex:urls.count - 1 - indexPath.row] addToHistory:NO];
}

- (NSInteger)tableView:(UITableView *)tableView numberOfRowsInSection:(NSInteger)section {
  return urls.count;
}

- (NSInteger)numberOfSectionsInTableView:(UITableView *)tableView {
  return 1;
}

- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath {
  UITableViewCell *cell = [[UITableViewCell alloc] init];
  NSLog(@"row %i", indexPath.row);
  cell.textLabel.text = [urls objectAtIndex:urls.count - 1 - indexPath.row];
  return cell;
}

- (void)webView:(UIWebView *)webView didFailLoadWithError:(NSError *)error {
  [hud hide:YES];
  NSString *message = [error.userInfo objectForKey:@"NSLocalizedDescription"];
  UIAlertView *alert = [[UIAlertView alloc] initWithTitle:@"Error" 
                                                  message:message delegate:nil 
                                        cancelButtonTitle:@"OK" otherButtonTitles:nil];
  [self showUrlBar:nil];
  [alert show];
  NSLog(@"didFailLoadWithError %@", error);
}

- (void)viewDidUnload
{
  [super viewDidUnload];
  // Release any retained subviews of the main view.
}

- (BOOL)shouldAutorotateToInterfaceOrientation:(UIInterfaceOrientation)interfaceOrientation
{
	return NO;
}

-(void)showUrlBar:(id)sender {
  urlBar.hidden = NO;
  [urlField becomeFirstResponder];
  NSLog(@"show url bar");
}

@end
