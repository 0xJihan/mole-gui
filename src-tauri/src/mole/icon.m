#import <Cocoa/Cocoa.h>

char* get_app_icon_png_base64(const char* app_path) {
    if (!app_path) return NULL;
    @autoreleasepool {
        NSString* path = [NSString stringWithUTF8String:app_path];
        if (![[NSFileManager defaultManager] fileExistsAtPath:path]) {
            return NULL;
        }

        NSImage* img = [[NSWorkspace sharedWorkspace] iconForFile:path];
        if (!img) return NULL;

        NSBitmapImageRep *rep = [[NSBitmapImageRep alloc]
            initWithBitmapDataPlanes:NULL
            pixelsWide:64
            pixelsHigh:64
            bitsPerSample:8
            samplesPerPixel:4
            hasAlpha:YES
            isPlanar:NO
            colorSpaceName:NSCalibratedRGBColorSpace
            bytesPerRow:64 * 4
            bitsPerPixel:32];

        if (!rep) return NULL;

        [NSGraphicsContext saveGraphicsState];
        [NSGraphicsContext setCurrentContext:[NSGraphicsContext graphicsContextWithBitmapImageRep:rep]];
        [img drawInRect:NSMakeRect(0, 0, 64, 64)
               fromRect:NSZeroRect
              operation:NSCompositingOperationCopy
               fraction:1.0];
        [NSGraphicsContext restoreGraphicsState];

        NSData *png = [rep representationUsingType:NSBitmapImageFileTypePNG properties:@{}];
        if (!png) return NULL;

        NSString *b64 = [png base64EncodedStringWithOptions:0];
        if (!b64) return NULL;

        return strdup([b64 UTF8String]);
    }
}

void free_app_icon_png_base64(char* ptr) {
    if (ptr) {
        free(ptr);
    }
}
