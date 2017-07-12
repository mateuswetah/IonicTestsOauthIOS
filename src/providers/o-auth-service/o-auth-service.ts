import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Rx';
import { Http, URLSearchParams, Response, Headers, } from '@angular/http';
import 'rxjs/add/operator/map';
import { InAppBrowser } from '@ionic-native/in-app-browser';

import oauthSignature from 'oauth-signature';
/*
  Generated class for the OAuthServiceProvider provider.

  See https://angular.io/docs/ts/latest/guide/dependency-injection.html
  for more info on providers and Angular DI.
*/
@Injectable()
export class OAuthServiceProvider {

  apiURL = 'http://rhs.dev.medialab.ufg.br/';
  //apiURL = 'http://10.0.1.242/rhs/';
  //callbackURL = 'http://10.0.1.242/rhs/api-login-callback';
  callbackURL = 'http://rhs.dev.medialab.ufg.br/api-login-callback';
  //consumerKey = 'c6t7gamHNaaj';
  consumerKey = 'pFJYeefHiIEa';
  //consumerSecret = 'mNhK1MsImOJAeobRDE9Zjc7Qz0thc9rqhzxtAjh6snF8nHcK';
  consumerSecret = 'AwHkgMLqvvkA5IqIvJGyTqYlqxjALt0brjLmGFOK0WlTitGg';

  JSON: any = JSON;

  constructor(public http: Http,
              private iab: InAppBrowser) {}

  // Obtain temporary token credentials
  getTemporaryCredentials():
      Observable<{oauthCallbackConfirmed: string, oauthToken: string, oauthTokenSecret: string}> {

        let parameters = {
          oauth_consumer_key: this.consumerKey,
          oauth_nonce: this.generateNonce(),
          oauth_timestamp: new String(new Date().getTime()).substr(0,10),
          oauth_signature_method: 'HMAC-SHA1',
          oauth_version: '1.0',
          oauth_callback: this.callbackURL 
        };

        let signature = oauthSignature.generate('POST', this.apiURL + 'oauth1/request', parameters, this.consumerSecret);

        let headers = new Headers();
        headers.append('Authorization', 'OAuth oauth_consumer_key="' + this.consumerKey + '",oauth_signature_method="HMAC-SHA1",oauth_timestamp="' + parameters.oauth_timestamp + '",oauth_nonce="' + parameters.oauth_nonce + '",oauth_version="1.0",oauth_signature="' + signature + '",oauth_callback="' + this.callbackURL + '"');
    return this.http.post(this.apiURL + 'oauth1/request',{}, {headers: headers})
      .map((res: Response) => {
        
        let temporaryCredentials = this.queryToObject(res['_body']);

        return { 
          oauthCallbackConfirmed: temporaryCredentials.oauth_callback_confirmed, 
          oauthToken: temporaryCredentials.oauth_token, 
          oauthTokenSecret: temporaryCredentials.oauth_token_secret 
        };
      })
      .catch((error: any) => this.handleError(error));
   }

  // Obtain final token credentials
  getAccessCredentials(oauthToken: string, oauthTokenSecret: string, oauthVerifier: string):
      Observable<{oauthToken: string, oauthTokenSecret: string}> {

        let parameters = {
          oauth_verifier: oauthVerifier,
          oauth_consumer_key: this.consumerKey,
          oauth_token: oauthToken,
          oauth_nonce: this.generateNonce(),
          oauth_timestamp: new String(new Date().getTime()).substr(0,10),
          oauth_signature_method: 'HMAC-SHA1',
          oauth_version: '1.0' 
        };

        let signature = oauthSignature.generate('GET', this.apiURL + 'oauth1/access', parameters, this.consumerSecret, oauthTokenSecret);

        let headers = new Headers();
        headers.append('Authorization', 'OAuth oauth_consumer_key="' + this.consumerKey + 
        '",oauth_signature_method="HMAC-SHA1",oauth_timestamp="' + parameters.oauth_timestamp + 
        '",oauth_nonce="' + parameters.oauth_nonce + '",oauth_version="1.0",oauth_signature="' + signature + 
        '",oauth_token="' + oauthToken + '"');

    return this.http.get(this.apiURL + 'oauth1/access?oauth_verifier=' + oauthVerifier, {headers: headers})
      .map((res: Response) => {
        
        let finalCredentials = this.queryToObject(res['_body']);

        return { 
          oauthToken: finalCredentials.oauth_token, 
          oauthTokenSecret: finalCredentials.oauth_token_secret 
        };
      })
      .catch((error: any) => this.handleError(error));
  }

  // Obtain temporary token credentials
  getAuthorizeCredentials(oauthToken: string, oauthTokenSecret: string):
      Observable<{oauthVerifier: string}> {

        let ob = new Observable();
        //const browser = this.iab.create('http://10.0.1.242/rhs/oauth1/authorize?oauth_token=' + temporaryCredentials.oauthToken + '&oauth_token_secret=' + temporaryCredentials.oauthTokenSecret);
        const browser = this.iab.create('http://rhs.dev.medialab.ufg.br/oauth1/authorize?oauth_token=' + oauthToken + '&oauth_token_secret=' + oauthTokenSecret);

        return new Observable(function(observer) {

          browser.on("loadstop").subscribe((event)=>{
              let url = new URL(event.url);
              let oauth_verifier = url.searchParams.get('oauth_verifier');
              let oauth_token = url.searchParams.get('oauth_token'); 

              if (oauth_verifier !== null && oauth_verifier !== undefined) {
                
                browser.close(); 
                observer.next({oauth_verifier});
                observer.complete();
              }
          });

        });

      }

  // Obtain temporary token credentials
  getUserInfo(oauthToken: string, oauthTokenSecret: string):
      Observable<{any}> {

        let parameters = {
          oauth_consumer_key: this.consumerKey,
          oauth_token: oauthToken,
          oauth_signature_method: 'HMAC-SHA1',
          oauth_timestamp: new String(new Date().getTime()).substr(0,10),
          oauth_nonce: this.generateNonce(),
          oauth_version: '1.0' 
        };

        let signature = oauthSignature.generate('GET', this.apiURL + 'wp-json/wp/v2/users/me', parameters, this.consumerSecret, oauthTokenSecret);
        let headers = new Headers();
        headers.append('Authorization', 'OAuth oauth_consumer_key="' + this.consumerKey + '",oauth_token="' + oauthToken + '",oauth_signature_method="HMAC-SHA1",oauth_timestamp="' + parameters.oauth_timestamp + '",oauth_nonce="' + parameters.oauth_nonce + '",oauth_version="1.0",oauth_signature="' + signature + '"');
        //headers.append('Cookie', 'token=deleted; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT');
        //headers.append('Content-Type','application/x-www-form-urlencoded');

    return this.http.get(this.apiURL + 'wp-json/wp/v2/users/me', {headers: headers})
      .map((res: Response) => {
        
        let userInfo = res;

        return { 
          userInfo
        };
      })
      .catch((error: any) => this.handleError(error));
  } 

  // Obtain user info
  getTestInfo(oauthToken: string, oauthTokenSecret: string):
      Observable<{any}> {

        let parameters = {
          oauth_consumer_key: this.consumerKey,
          oauth_token: oauthToken,
          oauth_signature_method: 'HMAC-SHA1',
          oauth_timestamp: new String(new Date().getTime()).substr(0,10),
          oauth_nonce: this.generateNonce(),
          oauth_version: '1.0' 
        };

        let signature = oauthSignature.generate('GET', this.apiURL + 'wp-json/rhs/v1/teste/1', parameters, this.consumerSecret, oauthTokenSecret);
        let headers = new Headers();
        headers.append('Authorization', 'OAuth oauth_consumer_key="' + this.consumerKey + '",oauth_token="' + oauthToken + '",oauth_signature_method="HMAC-SHA1",oauth_timestamp="' + parameters.oauth_timestamp + '",oauth_nonce="' + parameters.oauth_nonce + '",oauth_version="1.0",oauth_signature="' + signature + '"');
        //headers.append('Cookie', 'token=deleted; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT');
        //headers.append('Content-Type','application/x-www-form-urlencoded');

    return this.http.get(this.apiURL + 'wp-json/rhs/v1/teste/1', {headers: headers})
      .map((res: Response) => {
        
        let userInfo = res;

        return { 
          userInfo
        };
      })
      .catch((error: any) => this.handleError(error));
  } 

  // ==== UTILITIES  ======================================================================
  // Trata o casos de falha baseado no código de erro
  private handleError(error: Response) {
    console.error(error);
    return Observable.throw(error.status);
  }

  // Converte queries de uma hash de parâmetros em uma URLSearchParam
  private serializeQueries(obj: any): URLSearchParams {
    const params: URLSearchParams = new URLSearchParams();

    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const element = obj[key];
            params.set(key, element);
        }
    }

    return params;
  }

  // 
  public queryToObject(query: string) {
    return JSON.parse('{"' + decodeURI(query).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g,'":"') + '"}');
  }
  
  // Generates radom nonce
  public generateNonce() {
    var text = "";
    let length = 32;
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for(var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return btoa(text);
  }

}
