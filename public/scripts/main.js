
var rhit = rhit || {};

rhit.FB_COLLECTION_SURVEYS = "Surveys";
rhit.FB_KEY_NAME = "name";
rhit.FB_KEY_QUESTIONS = "questions";
rhit.FB_KEY_TIME_POSTED = "timePosted";
rhit.FB_KEY_AUTHOR = "author";
rhit.singleSurveyManager = null;
rhit.surveysManager = null;
rhit.resultsManager = null;
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
    document.querySelector("#menuShowAllSurveys").onclick = (event) => {
      window.location.href = "/list.html";
    };

    document.querySelector("#menuShowMySurveys").onclick = (event) => {
      window.location.href = `/list.html?uid=${rhit.fbAuthManager.uid}`;
    };

    document.querySelector("#menuSignOut").onclick = (event) => {
      rhit.fbAuthManager.signOut();
    };

     rhit.fbMovieQuotesManager.beginListening(this.updateList.bind(this));
  }

  _createCard(movieQuote) {
    return htmlToElement(`<div class="card">
          <div class="card-body">
            <blockquote class="blockquote mb-0">
              <p>${movieQuote.quote}</p>  
              <footer class="blockquote-footer">
                <cite title="Source Title">${movieQuote.movie}</cite>
              </footer>
            </blockquote>
          </div>
        </div>`);
  }


  updateList() {
    console.log("update list");
    console.log(`Num quotes = ${rhit.fbMovieQuotesManager.length}`);
    console.log(
      "Example quote = ",
      rhit.fbMovieQuotesManager.getMovieQuoteAtIndex(0)
    );

    // Make a new quoteListContainer
    const newList = htmlToElement('<div id="quoteListContainer"></div>');
    // Fill
    for (let i = 0; i < rhit.fbMovieQuotesManager.length; i++) {
      const mq = rhit.fbMovieQuotesManager.getMovieQuoteAtIndex(i);
      const newCard = this._createCard(mq);

      newCard.onclick = (event) => {
        // rhit.storage.setMovieQuoteId(mq.id);

        window.location.href = `/moviequote.html?id=${mq.id}`;
      };

      newList.appendChild(newCard);
    }

    // Remove old
    const oldList = document.querySelector("#quoteListContainer");
    oldList.removeAttribute("id");
    oldList.hidden = true;
    // Put in new
    oldList.parentElement.appendChild(newList);
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
    Rosefire.signIn("cde06e0a-db30-4dab-845a-a63409f9d16b", (err, rfUser) => {
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
  // if (document.querySelector("#listPage")) {
  //   const uid = urlParams.get("uid");
  //   rhit.fbMovieQuotesManager = new rhit.FbMovieQuotesManager(uid);
  //   new rhit.ListPageController();
  // }

  // if (document.querySelector("#detailPage")) {
  //   // const movieQuoteId = rhit.storage.getMovieQuoteId();
  //   // console.log(`Detail page for ${movieQuoteId}`);

  //   const movieQuoteId = urlParams.get("id");

  //   if (!movieQuoteId) {
  //     window.location.href = "/";
  //   }

  //   rhit.fbSingleQuoteManager = new rhit.FbSingleQuoteManager(movieQuoteId);
  //   new rhit.DetailPageController();
  // }

  if (document.querySelector("#loginPage")) {
    new rhit.LoginController();
  }

  if (document.querySelector("#listPage")) {
    new rhit.MainMenuController();
  }
};

/* Main */
/** function and class syntax examples */
rhit.main = function () {
  console.log("Ready");
  new rhit.MainMenuController();
  rhit.fbAuthManager = new rhit.FbAuthManager();
  rhit.fbAuthManager.beginListening(() => {
    console.log("auth change callcback fired.");

    rhit.checkForRedirects();
    rhit.initializePage();
  });
};

rhit.main();
