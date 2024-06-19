import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Keyboard, StyleSheet, TextInput, View } from 'react-native';
import uuid from 'react-native-uuid';
import { WebView } from 'react-native-webview';

const TinyMCEEditor = forwardRef(({ apiKey, width, height, content, editorId, onFocus, onReady }, ref) => {
  const webViewRef = useRef(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [webViewHeight, setWebViewHeight] = useState('100%');
  const hiddenInputRef = useRef(null);
  const pendingPromises = useRef({});

  useImperativeHandle(ref, () => ({
    executeCommand: (command, value) => {
      if (webViewRef.current) {
        const script = `
          (function() {
            const editor = tinymce.get('${editorId}');
            if (editor) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                message: 'Executing command',
                command: '${command}',
                value: ${JSON.stringify(value)},
                editorId: '${editorId}'
              }));
              editor.execCommand('${command}', false, ${JSON.stringify(value)});
            } else {
              window.ReactNativeWebView.postMessage(JSON.stringify({ message: 'Editor not initialized' }));
            }
          })();
        `;
        webViewRef.current.injectJavaScript(script);
      }
    },
    setSize: (newWidth, newHeight) => {
      if (webViewRef.current) {
        const script = `
          (function() {
            const editor = tinymce.get('${editorId}');
            if (editor) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                message: 'Setting size',
                width: ${newWidth},
                height: ${newHeight},
                editorId: '${editorId}'
              }));
              editor.getContainer().style.width = '${newWidth}px';
              editor.getContainer().style.height = '${newHeight}px';
              editor.execCommand('mceResize', false);
            } else {
              window.ReactNativeWebView.postMessage(JSON.stringify({ message: 'Editor not initialized' }));
            }
          })();
        `;
        webViewRef.current.injectJavaScript(script);
      }
    },
    getContent: () => {
      return new Promise((resolve, reject) => {
        const messageId = uuid.v4();
        pendingPromises.current[messageId] = { resolve, reject };
        const script = `
          (function() {
            const editor = tinymce.get('${editorId}');
            if (editor) {
              const content = editor.getContent();
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'getContent',
                editorId: '${editorId}',
                content: JSON.stringify({ content }),
                messageId: '${messageId}'
              }));
            } else {
              window.ReactNativeWebView.postMessage(JSON.stringify({ message: 'Editor not initialized' }));
            }
          })();
        `;
        webViewRef.current.injectJavaScript(script);
      });
    },
    setContent: (content) => {
      if (webViewRef.current) {
        const parsedContent = JSON.parse(content).content;
        const script = `
          (function() {
            const editor = tinymce.get('${editorId}');
            if (editor) {
              editor.setContent(${JSON.stringify(parsedContent)});
              window.ReactNativeWebView.postMessage(JSON.stringify({
                message: 'Setting content',
                content: ${JSON.stringify(parsedContent)},
                editorId: '${editorId}'
              }));
            } else {
              window.ReactNativeWebView.postMessage(JSON.stringify({ message: 'Editor not initialized' }));
            }
          })();
        `;
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

  useEffect(() => {
    if (webViewRef.current) {
      const script = `
        tinymce.init({
          selector: '#${editorId}',
          height: '100%',
          menubar: false,
          plugins: [
            'advlist autolink lists link image charmap print preview anchor',
            'searchreplace visualblocks code fullscreen',
            'insertdatetime media table paste code help wordcount'
          ],
          setup: function (editor) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'editorSetup', editorId: '${editorId}' }));
            editor.on('focus', function () {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'focus', editorId: '${editorId}' }));
            });
            editor.on('blur', function () {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'blur', editorId: '${editorId}' }));
            });
          }
        });
        setTimeout(() => {
          const editor = tinymce.get('${editorId}');
          if (editor) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ message: 'Setting initial content for editor', editorId: '${editorId}' }));
            editor.setContent(${JSON.stringify(content)});
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'editorReady', editorId: '${editorId}' }));
          }
        }, 1000);
      `;
      webViewRef.current.injectJavaScript(script);
    }
  }, [editorId, content, width, height]);

  const handleMessage = (event) => {
    const data = JSON.parse(event.nativeEvent.data);
    console.log('Message received:', data);
    if (data.type === 'getContent' && data.messageId) {
      const { resolve, reject } = pendingPromises.current[data.messageId];
      if (resolve) {
        resolve(data.content);
        delete pendingPromises.current[data.messageId];
      }
    } else if (data.messageId) {
      const { reject } = pendingPromises.current[data.messageId];
      if (reject) {
        reject(new Error(data.message || 'Unknown error'));
        delete pendingPromises.current[data.messageId];
      }
    } else if (data.type === 'focus' && data.editorId === editorId) {
      if (onFocus) {
        onFocus();
      }
    } else if (data.type === 'editorReady' && data.editorId === editorId) {
      if (onReady) {
        onReady();
      }
    }
  };

  const editorHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="referrer" content="origin">
    <script src="https://cdn.tiny.cloud/1/${apiKey}/tinymce/5/tinymce.min.js" referrerpolicy="origin"></script>
    <style>
      body, html { padding: 0; margin: 0; height: 100%; width: 100%; }
      textarea { width: 100%; height: 100%; }
    </style>
  </head>
  <body>
    <textarea id="${editorId}">Hello, World!</textarea>
    <script>
      document.addEventListener('DOMContentLoaded', function() {
        window.ReactNativeWebView.postMessage(JSON.stringify({ message: 'Initializing TinyMCE editor', editorId: '${editorId}' }));
        tinymce.init({
          selector: '#${editorId}',
          menubar: false,
          plugins: 'link image code autoresize',
          toolbar: false,
          autoresize_bottom_margin: 20,
          setup: function (editor) {
            editor.on('init', function () {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'editorReady', editorId: '${editorId}' }));
            });
            editor.on('focus', function () {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'focus', editorId: '${editorId}' }));
            });
            editor.on('blur', function () {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'blur', editorId: '${editorId}' }));
            });
            var observer = new MutationObserver(function(mutations) {
              mutations.forEach(function(mutation) {
                if (mutation.addedNodes.length) {
                  mutation.addedNodes.forEach(function(node) {
                    if (node.classList && node.classList.contains('tox-notification')) {
                      node.style.display = 'none';
                    }
                  });
                }
              });
            });
            observer.observe(document.body, { childList: true, subtree: true });
          }
        });
      });
    </script>
  </body>
  </html>`;

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        javaScriptEnabled={true}
        onLoad={() => console.log('WebView loaded')}
        originWhitelist={['*']}
        source={{ html: editorHtml }}
        style={[styles.webview, { height: webViewHeight }]}
        onMessage={handleMessage}
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
