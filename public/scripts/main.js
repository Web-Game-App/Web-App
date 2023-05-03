// https://rose-surveys.web.app
var rhit = rhit || {};

rhit.FB_COLLECTION_SURVEYS = "Surveys";
rhit.FB_KEY_NAME = "name";
rhit.FB_KEY_QUESTIONS = "questions";
rhit.FB_KEY_RESPONSES = "responses";
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
      window.location.href = `/userSurveyPage.html?uid=${rhit.fbAuthManager.uid}`;
    };

    document.querySelector("#menuSignOut").onclick = (event) => {
      rhit.fbAuthManager.signOut();
    };

     rhit.surveysManager.beginListening(this.updateList.bind(this));
  }

  _createCard(survey) {
    return htmlToElement(`<div
                  class="card row-hover pos-relative py-3 px-3 mb-3 border-warning border-top-0 border-right-0 border-bottom-0 rounded-0"
                >
                  <div class="row align-items-center">
                    <div class="col-md-8 mb-3 mb-sm-0">
                      <h5>
                        <a href="/question.html?id=${survey.id}" class="text-primary"
                          >${survey.name}</a
                        >
                      </h5>
                      <p class="text-sm">
                        <span class="op-6">Posted by</span>
                        <a class="text-black" href="#">${survey.author}</a>
                      </p>
                    </div>
                    <div class="col-md-4 op-7">
                      <div class="row text-right op-7">
                        <div class="col px-1">
                          <i class="ion-connection-bars icon-1x"></i>
                          <span class="d-block text-sm">${survey.numResponses} Responses</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>`);
  }


  updateList() {
    

    // Make a new quoteListContainer
    const newList = htmlToElement('<div id="surveyColumn">');
    // Fill
    for (let i = 0; i < rhit.surveysManager.length; i++) {
      const survey = rhit.surveysManager.getSurveyAtIndex(i);
      const newCard = this._createCard(survey);

      // newCard.onclick = (event) => {
      //   // rhit.storage.setMovieQuoteId(mq.id);

      //   window.location.href = `/moviequote.html?id=${mq.id}`;
      // };

      newList.appendChild(newCard);
    }

    // Remove old
    const oldList = document.querySelector("#surveyColumn");
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

rhit.Survey = class {
  constructor(id, name, author, responses) {
    this.id = id;
    this.name = name;
    this.author = author;
    this.numResponses = responses;
  }
};

rhit.ResultsController = class {
  constructor(results) {
    this.results = results;
  }
  getResultsofSurvey() {

  }
};

rhit.SurveysManager = class {
  constructor(uid) {
    this._uid = uid;
    this._documentSnapshots = [];
    this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_SURVEYS);
    this._unsubscribe = null;
  }
  add(name, author, questions) {
    // add quote
  }
  beginListening(changeListener) {
    let query = this._ref.orderBy(rhit.FB_KEY_TIME_POSTED, "desc").limit(50);

    if (this._uid) {
      query = query.where(rhit.FB_KEY_AUTHOR, "==", this._uid);
    }

    this._unsubscribe = query.onSnapshot((querySnapshot) => {
      // querySnapshot.forEach((doc) => {
      //     console.log(doc.data());
      // });

      this._documentSnapshots = querySnapshot.docs;
      changeListener();
    });
  }
  stopListening() {
    this._unsubscribe();
  }
  //  update(id, quote, movie) {    }
  //  delete(id) { }
  get length() {
    return this._documentSnapshots.length;
  }
  getSurveyAtIndex(index) {
    const docSnapshot = this._documentSnapshots[index];
    const survey = new rhit.Survey(
      docSnapshot.id,
      docSnapshot.get(rhit.FB_KEY_NAME),
      docSnapshot.get(rhit.FB_KEY_AUTHOR),
      docSnapshot.get(rhit.FB_KEY_RESPONSES)
    );
    return survey;
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
  if (document.querySelector("#listPage")) {
    const uid = urlParams.get("uid");
    rhit.surveysManager = new rhit.SurveysManager(uid);
    new rhit.MainMenuController();
  }

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
