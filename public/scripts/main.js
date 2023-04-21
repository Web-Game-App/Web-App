
var rhit = rhit || {};

rhit.FB_COLLECTION_MOVIEQUOTES = "MovieQuotes";
rhit.FB_KEY_QUOTE = "quote";
rhit.FB_KEY_MOVIE = "movie";
rhit.FB_KEY_LAST_TOUCHED = "lastTouched";
rhit.FB_KEY_AUTHOR = "author";
rhit.fbMovieQuotesManager = null;
rhit.fbSingleQuoteManager = null;
rhit.fbAuthManager = null;

// From: https://stackoverflow.com/questions/494143/creating-a-new-dom-element-from-an-html-string-using-built-in-dom-methods-or-pro/35385518#35385518
function htmlToElement(html) {
  var template = document.createElement("template");
  html = html.trim();
  template.innerHTML = html;
  return template.content.firstChild;
}

rhit.MainMenuController = class {
  constructor() {
    
  }


  updateView() {
    
  }
};

rhit.Question = class {
  constructor() {
    
  }
};

rhit.SingleSurveyManager = class {
  constructor(questions) {
    this.questions = questions;
  }
  getAnswers() {

  }

  addQuestion() {

  }
  
};

rhit.MainMenuController = class {
  constructor() {

  }
  updateView() {

  }
};

rhit.ResultsController = class {
  constructor(results) {
    this.results = results;
  }
  getResultsofSurvey() {

  }
};

rhit.SurveysController = class {
  constructor(user, surveys) {
    this.user = user
    this.surveys = surveys;
  }
  createCard() {

  }
  updateSurvey() {

  }
  getSruveyAtIndex() {

  }
  addSurvey() {
    
  }
};

rhit.LoginController = class {
  constructor() {
    document.querySelector("#rosefireButton").onclick = (event) => {
      rhit.fbAuthManager.signIn();
    };
  }
};

rhit.FbAuthManager = class {
  constructor() {
    this._user = null;
  }
  beginListening(changeListener) {
    firebase.auth().onAuthStateChanged((user) => {
      this._user = user;
      changeListener();
    });
  }
  signIn() {
    Rosefire.signIn("af481816-1cd0-4ffb-9711-03ad8f042ca1", (err, rfUser) => {
      if (err) {
        console.log("Rosefire error!", err);
        return;
      }
      console.log("Rosefire success!", rfUser);

      // Next use the Rosefire token with Firebase auth.
      firebase
        .auth()
        .signInWithCustomToken(rfUser.token)
        .catch((error) => {
          if (error.code === "auth/invalid-custom-token") {
            console.log("The token you provided is not valid.");
          } else {
            console.log("signInWithCustomToken error", error.message);
          }
        }); // Note: Success should be handled by an onAuthStateChanged listener.
    });
  }
  signOut() {
    firebase.auth().signOut();
  }
  get uid() {
    return this._user.uid;
  }
  get isSignedIn() {
    return !!this._user;
  }
};

rhit.checkForRedirects = function () {
  if (document.querySelector("#loginPage") && rhit.fbAuthManager.isSignedIn) {
    window.location.href = "/list.html";
  }

  if (!document.querySelector("#loginPage") && !rhit.fbAuthManager.isSignedIn) {
    window.location.href = "/";
  }
};

rhit.initializePage = function () {
  const urlParams = new URLSearchParams(window.location.search);
  if (document.querySelector("#listPage")) {
    const uid = urlParams.get("uid");
    rhit.fbMovieQuotesManager = new rhit.FbMovieQuotesManager(uid);
    new rhit.ListPageController();
  }

  if (document.querySelector("#detailPage")) {
    // const movieQuoteId = rhit.storage.getMovieQuoteId();
    // console.log(`Detail page for ${movieQuoteId}`);

    const movieQuoteId = urlParams.get("id");

    if (!movieQuoteId) {
      window.location.href = "/";
    }

    rhit.fbSingleQuoteManager = new rhit.FbSingleQuoteManager(movieQuoteId);
    new rhit.DetailPageController();
  }

  if (document.querySelector("#loginPage")) {
    new rhit.LoginPageController();
  }
};

/* Main */
/** function and class syntax examples */
rhit.main = function () {
  console.log("Ready");
  rhit.fbAuthManager = new rhit.FbAuthManager();
  rhit.fbAuthManager.beginListening(() => {
    console.log("auth change callcback fired.");

    rhit.checkForRedirects();
    rhit.initializePage();
  });
};

rhit.main();
