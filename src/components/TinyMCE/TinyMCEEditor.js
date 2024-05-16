import React, { useEffect, useRef, useState } from 'react';
import { Keyboard, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import BottomToolbar from './BottomToolbar';

const TinyMCEEditor = ({ apiKey }) => {
  const webViewRef = useRef(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [webViewHeight, setWebViewHeight] = useState('100%');

  const executeCommand = (command, value = null) => {
    if (webViewRef.current) {
      const script = `if(window.myEditor) { window.myEditor.execCommand('${command}', false, ${JSON.stringify(value)}); } else { console.error('Editor not initialized'); }`;
      webViewRef.current.injectJavaScript(script);
    }
  };

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
          body, html { padding: 0; margin: 0; height: 100%; }
          textarea { width: 100%; height: 100%; min-height: 300px; }
          .tox .tox-notification, .tox .tox-notification--warn, .tox .tox-notification--error, .tox .tox-notification__body, .tox .tox-notification__dismiss, .tox .tox-notification-bar { display: none !important; }
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
              toolbar_sticky: true,
              content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
              setup: function (editor) {
                window.myEditor = editor;
                // MutationObserver to monitor and hide notifications
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
        
                editor.on('init', function () {
                  console.log('Editor is initialized.');
                });
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
      />
      <BottomToolbar executeCommand={executeCommand} keyboardHeight={keyboardHeight} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  webview: {
    width: '100%',
    flex: 1,
  }
});

export default TinyMCEEditor;
