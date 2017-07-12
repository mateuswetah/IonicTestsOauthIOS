import { Component } from '@angular/core';
import { NavController, NavParams, ToastController } from 'ionic-angular';
import { Http } from '@angular/http';
import { Storage } from '@ionic/storage';
import { InAppBrowser } from '@ionic-native/in-app-browser';
import { Observable } from 'rxjs/Rx';

import { OAuthServiceProvider } from './../../providers/o-auth-service/o-auth-service';

@Component({
  selector: 'page-login',
  templateUrl: 'login.html',
})
export class LoginPage {

  constructor(public navCtrl: NavController,
               public navParams: NavParams,
               public storage: Storage,
               private iab: InAppBrowser,
               public toastCtrl: ToastController,
               private oAuthService: OAuthServiceProvider,
               private http: Http){
               }

  ionViewDidLoad() {
    this.login();
  }

  checkToken() {
    this.storage.get('oauth_token_key').then((tokenKey) => {  
      if (tokenKey !== null && tokenKey !== undefined) {
        this.createToast('Usuário Logado!');  
        this.storage.get('oauth_token_secret').then((tokenSecret) => { 
          this.loadUserInfo(tokenKey, tokenSecret);
        });           
      } else {
        this.login();
      }
    });
  }

  loadUserInfo(tokenKey: string, tokenSecret: string ) {
      console.log(tokenKey);
      console.log(tokenSecret);
      
    this.oAuthService.getTestInfo(tokenKey, tokenSecret).subscribe(
      userInfo => {
      console.log(userInfo);
    },
    err => {
      this.createToast('Error ' + err +  ' - On User Data Request.');
    });
  }

  login() {

    this.oAuthService.getTemporaryCredentials().subscribe(
      temporaryCredentials => {

        if (temporaryCredentials.oauthToken !== null && temporaryCredentials.oauthTokenSecret !== null) {
          
          //const browser = this.iab.create('http://10.0.1.242/rhs/oauth1/authorize?oauth_token=' + temporaryCredentials.oauthToken + '&oauth_token_secret=' + temporaryCredentials.oauthTokenSecret, '_blank');
          const browser = this.iab.create('http://rhs.dev.medialab.ufg.br/oauth1/authorize?oauth_token=' + temporaryCredentials.oauthToken + '&oauth_token_secret=' + temporaryCredentials.oauthTokenSecret, '_blank');
          
          browser.on("loadstop").subscribe((event)=>{
              let url = new URL(event.url);
              let oauth_verifier = url.searchParams.get('oauth_verifier');
              let oauth_token = url.searchParams.get('oauth_token'); 

              if (oauth_verifier !== null && oauth_verifier !== undefined) {

                browser.close(); 
                
                this.oAuthService.getAccessCredentials(temporaryCredentials.oauthToken, temporaryCredentials.oauthTokenSecret, oauth_verifier).subscribe(
                  finalCredentials => {
                    if (finalCredentials.oauthToken !== null  && finalCredentials.oauthTokenSecret !== null) {
                      this.storage.set('oauth_token_key', finalCredentials.oauthToken);
                      this.storage.set('oauth_token_secret', finalCredentials.oauthTokenSecret);
                      this.loadUserInfo(finalCredentials.oauthToken, finalCredentials.oauthTokenSecret);
                    }
                  },
                  err => {
                    this.createToast('Error ' + err +  ' - Final Credentials Request: ');
                  },
                  () => {  });
              } else {
                if (oauth_token === null) {

                }
              }
          });
        }
      },
      err => {
        this.createToast('Error ' + err +  ' - Temporary Credentials Request: ');
      },
      () => {  });
  }

  createToast(message: string) {
    let toast = this.toastCtrl.create({
      message: message,
      duration: 3000
    });
    toast.present();
  }

  private handleError(error: Response) {
    console.error(error);
    return Observable.throw(error.status);
  }


}
