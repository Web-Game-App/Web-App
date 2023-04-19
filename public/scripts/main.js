/**
 * @fileoverview
 * Provides the JavaScript interactions for all pages.
 *
 * @author
 * PUT_YOUR_NAME_HERE
 */

/** namespace. */
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

rhit.ListPageController = class {
  constructor() {
    document.querySelector("#menuShowAllQuotes").onclick = (event) => {
      window.location.href = "/list.html";
    };

    document.querySelector("#menuShowMyQuotes").onclick = (event) => {
      window.location.href = `/list.html?uid=${rhit.fbAuthManager.uid}`;
    };

    document.querySelector("#menuSignOut").onclick = (event) => {
      rhit.fbAuthManager.signOut();
    };

    document.querySelector("#submitAddQuote").onclick = (event) => {
      const quote = document.querySelector("#inputQuote").value;
      const movie = document.querySelector("#inputMovie").value;
      rhit.fbMovieQuotesManager.add(quote, movie);
    };

    $("#addQuoteDialog").on("show.bs.modal", function (event) {
      // do something...
      document.querySelector("#inputQuote").value = "";
      document.querySelector("#inputMovie").value = "";
    });

    $("#addQuoteDialog").on("shown.bs.modal", function (event) {
      // do something...
      document.querySelector("#inputQuote").focus();
    });

    // Start listening
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

rhit.MovieQuote = class {
  constructor(id, quote, movie) {
    this.id = id;
    this.quote = quote;
    this.movie = movie;
  }
};

rhit.FbMovieQuotesManager = class {
  constructor(uid) {
    this._uid = uid;
    this._documentSnapshots = [];
    this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_MOVIEQUOTES);
    this._unsubscribe = null;
  }
  add(quote, movie) {
    // Add a new document with a generated id.
    this._ref
      .add({
        [rhit.FB_KEY_QUOTE]: quote,
        [rhit.FB_KEY_MOVIE]: movie,
        [rhit.FB_KEY_AUTHOR]: rhit.fbAuthManager.uid,
        [rhit.FB_KEY_LAST_TOUCHED]: firebase.firestore.Timestamp.now(),
      })
      .then((docRef) => {
        console.log("Document written with ID: ", docRef.id);
      })
      .catch((error) => {
        console.error("Error adding document: ", error);
      });
  }
  beginListening(changeListener) {
    let query = this._ref.orderBy(rhit.FB_KEY_LAST_TOUCHED, "desc").limit(50);

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
  getMovieQuoteAtIndex(index) {
    const docSnapshot = this._documentSnapshots[index];
    const mq = new rhit.MovieQuote(
      docSnapshot.id,
      docSnapshot.get(rhit.FB_KEY_QUOTE),
      docSnapshot.get(rhit.FB_KEY_MOVIE)
    );
    return mq;
  }
};

rhit.DetailPageController = class {
  constructor() {
    document.querySelector("#menuSignOut").onclick = (event) => {
      rhit.fbAuthManager.signOut();
    };

    document.querySelector("#submitEditQuote").onclick = (event) => {
      const quote = document.querySelector("#inputQuote").value;
      const movie = document.querySelector("#inputMovie").value;
      rhit.fbSingleQuoteManager.update(quote, movie);
    };

    $("#editQuoteDialog").on("show.bs.modal", function (event) {
      // do something...
      document.querySelector("#inputQuote").value =
        rhit.fbSingleQuoteManager.quote;
      document.querySelector("#inputMovie").value =
        rhit.fbSingleQuoteManager.movie;
    });

    $("#editQuoteDialog").on("shown.bs.modal", function (event) {
      // do something...
      document.querySelector("#inputQuote").focus();
    });

    document.querySelector("#submitDeleteQuote").onclick = (event) => {
      rhit.fbSingleQuoteManager
        .delete()
        .then(() => {
          console.log("Document successfully deleted!");
          window.location.href = "/list.html";
        })
        .catch((error) => {
          console.error("Error removing document: ", error);
        });
    };

    rhit.fbSingleQuoteManager.beginListening(this.updateView.bind(this));
  }
  updateView() {
    document.querySelector("#cardQuote").innerHTML =
      rhit.fbSingleQuoteManager.quote;
    document.querySelector("#cardMovie").innerHTML =
      rhit.fbSingleQuoteManager.movie;

    if (rhit.fbSingleQuoteManager.author == rhit.fbAuthManager.uid) {
      document.querySelector("#menuEdit").style.display = "flex";
      document.querySelector("#menuDelete").style.display = "flex";
    }
  }
};

rhit.FbSingleQuoteManager = class {
  constructor(movieQuoteId) {
    this._documentSnapshot = {};
    this._unsubscribe = null;
    this._ref = firebase
      .firestore()
      .collection(rhit.FB_COLLECTION_MOVIEQUOTES)
      .doc(movieQuoteId);
  }
  beginListening(changeListener) {
    this._unsubscribe = this._ref.onSnapshot((doc) => {
      if (doc.exists) {
        console.log("Document data:", doc.data());
        this._documentSnapshot = doc;
        changeListener();
      } else {
        // doc.data() will be undefined in this case
        console.log("No such document!");
      }
    });
  }
  stopListening() {
    this._unsubscribe();
  }
  update(quote, movie) {
    this._ref
      .update({
        [rhit.FB_KEY_QUOTE]: quote,
        [rhit.FB_KEY_MOVIE]: movie,
        [rhit.FB_KEY_LAST_TOUCHED]: firebase.firestore.Timestamp.now(),
      })
      .then(() => {
        console.log("Document successfully updated!");
      })
      .catch((error) => {
        // The document probably doesn't exist.
        console.error("Error updating document: ", error);
      });
  }
  delete() {
    return this._ref.delete();
  }

  get quote() {
    return this._documentSnapshot.get(rhit.FB_KEY_QUOTE);
  }
  get movie() {
    return this._documentSnapshot.get(rhit.FB_KEY_MOVIE);
  }
  get author() {
    return this._documentSnapshot.get(rhit.FB_KEY_AUTHOR);
  }
};

// rhit.storage = rhit.storage || {};
// rhit.storage.MOVIEQUOTE_ID_KEY = "movieQuoteId";
// rhit.storage.getMovieQuoteId = function () {
//   const mqId = sessionStorage.getItem(rhit.storage.MOVIEQUOTE_ID_KEY);
//   if (!mqId) {
//     console.log("No movie quote id in sessionStorage");
//   }
//   return mqId;
// };
// rhit.storage.setMovieQuoteId = function (movieQuoteId) {
//   sessionStorage.setItem(rhit.storage.MOVIEQUOTE_ID_KEY, movieQuoteId);
// };

rhit.LoginPageController = class {
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
