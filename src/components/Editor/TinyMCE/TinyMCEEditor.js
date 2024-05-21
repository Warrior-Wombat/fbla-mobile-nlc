import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Keyboard, StyleSheet, TextInput, View } from 'react-native';
import { WebView } from 'react-native-webview';

const TinyMCEEditor = forwardRef(({ apiKey, width, height }, ref) => {
  const webViewRef = useRef(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [webViewHeight, setWebViewHeight] = useState('100%');
  const hiddenInputRef = useRef(null);

  useImperativeHandle(ref, () => ({
    executeCommand: (command, value) => {
      if (webViewRef.current) {
        const script = `
          if (window.myEditor) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ message: 'Executing command: ${command}' }));
            window.myEditor.execCommand('${command}', false, ${JSON.stringify(value)});
          } else {
            window.ReactNativeWebView.postMessage(JSON.stringify({ message: 'Editor not initialized' }));
          }`;
        webViewRef.current.injectJavaScript(script);
      }
    },
    blurEditor: () => {
      if (webViewRef.current) {
        const script = `
          if (window.myEditor) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ message: 'Blurring editor' }));
            window.myEditor.blur();
          } else {
            window.ReactNativeWebView.postMessage(JSON.stringify({ message: 'Editor not initialized' }));
          }`;
        webViewRef.current.injectJavaScript(script);
      }
    },
    focusEditor: () => {
      if (webViewRef.current) {
        setTimeout(() => {
          const script = `
            if (window.myEditor) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ message: 'Focusing editor' }));
              window.myEditor.focus();
            } else {
              window.ReactNativeWebView.postMessage(JSON.stringify({ message: 'Editor focus function not available' }));
            }`;
          webViewRef.current.injectJavaScript(script);
        }, 100);
      }
    },
    setSize: (newWidth, newHeight) => {
      if (webViewRef.current) {
        const script = `
          if (window.myEditor) {
            window.myEditor.getContainer().style.width = '${newWidth}px';
            window.myEditor.getContainer().style.height = '${newHeight}px';
            window.myEditor.execCommand('mceResize', false);
          }`;
        webViewRef.current.injectJavaScript(script);
      }
    }
  }));

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      setWebViewHeight(`calc(100% - ${e.endCoordinates.height}px)`);
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
      setWebViewHeight('100%');
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const editorHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="referrer" content="origin">
        <script src="https://cdn.tiny.cloud/1/${apiKey}/tinymce/5/tinymce.min.js" referrerpolicy="origin"></script>
        <style>
          body, html { padding: 0; margin: 0; height: 100%; width: 100%; }
          textarea { width: 100%; height: 100%; min-height: 300px; }
          .tox .tox-notification, .tox .tox-notification--warn, .tox .tox-notification--error, .tox .tox-notification__body, .tox .tox-notification__dismiss, .tox .tox-notification-bar { display: none !important; }
          .tox .tox-toolbar__overflow { overflow-x: auto; }
          .tox-statusbar { display: none !important; }
        </style>
      </head>
      <body>
        <textarea id="editableText">Hello, World!</textarea>
        <script>
          document.addEventListener('DOMContentLoaded', function() {
            tinymce.init({
              selector: '#editableText',
              plugins: 'print preview paste importcss searchreplace autolink autosave save directionality code visualblocks visualchars fullscreen image link media template codesample table charmap hr pagebreak nonbreaking anchor toc insertdatetime advlist lists wordcount imagetools textpattern noneditable help charmap quickbars emoticons',
              toolbar: 'undo redo | fontselect fontsizeselect formatselect | alignleft aligncenter alignright alignjustify | outdent indent | numlist bullist checklist | forecolor backcolor casechange permanentpen formatpainter removeformat | pagebreak | charmap emoticons | fullscreen  preview save print | insertfile image media template link anchor codesample',
              toolbar_mode: 'scrolling',
              toolbar_sticky: true,
              content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
              width: '100%',
              height: '100%',
              resize: 'both',
              setup: function (editor) {
                window.myEditor = editor;
                window.focusTinyMCE = function() {
                  editor.focus();
                };
                window.blurTinyMCE = function() {
                  editor.blur();
                };
                if (typeof window.ReactNativeWebView !== 'undefined') {
                  window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'editorReady' }));
                }
              }
            });

            window.addEventListener('resize', () => {
              const editor = window.myEditor;
              if (editor) {
                const width = document.documentElement.clientWidth;
                const height = document.documentElement.clientHeight;
                editor.getContainer().style.width = width + 'px';
                editor.getContainer().style.height = height + 'px';
                editor.execCommand('mceResize', false);
              }
            });
          });
        </script>      
      </body>
    </html>`;

  useEffect(() => {
    if (webViewRef.current) {
      const script = `
        if (window.myEditor) {
          window.myEditor.getContainer().style.width = '${width}px';
          window.myEditor.getContainer().style.height = '${height}px';
          window.myEditor.execCommand('mceResize', false);
        }`;
      webViewRef.current.injectJavaScript(script);
    }
  }, [width, height]);

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        javaScriptEnabled={true}
        onLoad={() => console.log('WebView loaded')}
        originWhitelist={['*']}
        source={{ html: editorHtml }}
        style={[styles.webview, { height: webViewHeight }]}
        onMessage={(event) => {
          const data = JSON.parse(event.nativeEvent.data);
          if (data.type === 'editorReady') {
            const initialScript = `if (window.myEditor) { window.ReactNativeWebView.postMessage(JSON.stringify({ message: 'Blurring editor on load' })); window.myEditor.blur(); }`;
            webViewRef.current.injectJavaScript(initialScript);
          } else {
            console.log(data.message);
          }
        }}
      />
      <TextInput ref={hiddenInputRef} style={styles.hiddenInput} />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  webview: {
    width: '100%',
    flex: 1,
  },
  hiddenInput: {
    height: 0,
    width: 0,
    position: 'absolute',
    top: -1000,
  },
});

export default TinyMCEEditor;
