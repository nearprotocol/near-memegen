// Defining some global constants
const animateClass = 'glyphicon-refresh-animate';
const loadingHtml = '<span class="glyphicon glyphicon-refresh glyphicon-refresh-animate"></span> Loading'; 
const appTitle = 'NEAR Guest Book';
const walletBaseUrl = 'https://wallet.nearprotocol.com';
const TENOR_API_KEY = 'CIDF1JJPZGRB';
const TENOR_LIMIT = 20;

// Defining global variables that we initialize asynchronously later.
let walletAccount;
let accountId;
let contractId;
let baseUrl;
let near;
let contract;
let refreshTimeout;
let anon_id;
let currentGifs;
let selectedGif;
let numMemes = -1;

// Function that initializes the signIn button using WalletAccount 
function signedOutFlow() {
  $('#login-button').click(() => {
    walletAccount.requestSignIn(
      contractId,
      appTitle,
      baseUrl + '/',
      baseUrl + '/',
    );
  });
}

async function fetchMeme(id, obj) {
  let meme = await contract.getMeme({id});
  renderMeme(obj, meme);
  const text = 'Posted by ' + meme.sender;
  obj.click(() => {
    $('#myModalLabel').text(text);
    renderMeme($('#modal-meme'), meme);
    $('#myModal').modal('show'); // imagemodal is the id attribute assigned to the bootstrap modal, then i use the show function
  })
}

async function fetchLatestMemes() {
  let lastNum = await contract.getNumMemes({})
  if (numMemes == -1) {
    numMemes = Math.max(0, lastNum - 10);
  }
  for (let i = numMemes; i < lastNum; ++i) {
    let localObj = $('<div/>').addClass('meme-holder');
    fetchMeme(i, localObj);
   
    $('#messages').prepend(localObj);
  }
  numMemes = lastNum;
  $('#refresh-span').removeClass(animateClass);
}

// Calls view function on the contract and sets up timeout to be called again in 5 seconds
// It only calls the contract if the this page/tab is active.
function refreshMessages() {
  // If we already have a timeout scheduled, cancel it
  if (!!refreshTimeout) {
    clearTimeout(refreshTimeout);
    refreshTimeout = null;
  }
  // Schedules a new timeout
  refreshTimeout = setTimeout(refreshMessages, 5000);
  // Checking if the page is not active and exits without requesting messages from the chain
  // to avoid unnecessary queries to the devnet.
  if (document.hidden) {
    return;
  }
  // Adding animation UI
  $('#refresh-span').addClass(animateClass);
  // Calling the contract to read messages which makes a call to devnet.
  // The read call works even if the Account ID is not provided. 

  fetchLatestMemes()
    .catch(console.log);
  
}

function makeCurrentMeme() {
  return {
    timeMs: Math.trunc(new Date().getTime() / 1000),
    imgUrl: selectedGif.media[0].gif.url,
    topText: $('#text-top').val(),
    middleText: $('#text-middle').val(),
    bottomText: $('#text-bottom').val(),
  }
}

function renderMeme(obj, meme) {
  obj.empty();
  let wrapper = $('<div/>')
    .addClass("meme-wrapper");
  let img = $('<img/>')
    .addClass("meme-img")
    .attr('src', meme.imgUrl);
  let textTop = $('<p/>')
    .addClass("meme-text meme-text-top")
    .text(meme.topText);
  let textMiddle = $('<p/>')
    .addClass("meme-text meme-text-middle")
    .text(meme.middleText);
  let textBottom = $('<p/>')
    .addClass("meme-text meme-text-bottom")
    .text(meme.bottomText);
  wrapper.append([img, textTop, textMiddle, textBottom]);
  obj.append(wrapper);
}

function selectGif() {
  let index = $(this).data('gif-index');
  selectedGif = currentGifs[index];
  $('#meme-lord').removeClass('hidden');
  $('html, body').animate({
    scrollTop: $("#meme-lord").offset().top
  }, 500);
  $('#text-top').focus();
  renderMeme($('#meme-preview'), makeCurrentMeme());
}

function renderGifs(d) {
  currentGifs = d.results;
  let h = $('#gifs-preview');
  h.empty();
  for (let i = 0; i < currentGifs.length; ++i) {
    let g = currentGifs[i];
    let img = $('<img/>')
      .addClass("gif-preview")
      .data("gif-index", i)
      .attr('src', g.media[0].tinygif.url)
      .click(selectGif);
    h.append(img);
  }
}

function searchGif() {
  let search_term = $('#text-gif-search').val();
  if (!search_term) {
    $('#gifs-preview').empty();
    return;
  }
  let url = "https://api.tenor.com/v1/search?tag=" + encodeURIComponent(search_term)
      + "&key=" + TENOR_API_KEY
      + "&limit=" + TENOR_LIMIT
      + "&anon_id=" + anon_id;
  
  $.ajax({
    url,
    type: 'GET',
  }).then(renderGifs)
    .catch(console.error);
}

// Submits a new message to the devnet
function submitMeme() {
  let meme = makeCurrentMeme();
  $('#text-top, #text-middle, #text-bottom').val('');
  $('#meme-lord').addClass('hidden');
  $('#text-gif-search').val('');
  $('#gifs-preview').empty();
  $('html, body').animate({
    scrollTop: $("#text-gif-search").offset().top
  }, 500);
  $('#text-gif-search').focus();
  contract.addMeme(meme)
    .then(() => {
      // Starting refresh animation
      $('#refresh-span').addClass(animateClass);
      // Refreshing the messages in 1 seconds to account for the block creation
      setTimeout(() => {
        refreshMessages();
      }, 1000);
    })
    .catch(console.log);
}

async function initAnonId() {
  let result = await $.ajax({
    url: "https://api.tenor.com/v1/anonid?key=" + TENOR_API_KEY,
    type: 'GET',
  });
  anon_id = result.anon_id;
}

function initMemeEditing() {
  $('#text-top, #text-middle, #text-bottom').keyup(() => {
    renderMeme($('#meme-preview'), makeCurrentMeme());
  });

  $('#submit-meme').click(() => {
    submitMeme();
  });
}

let searchTimeout = null;

function scheduleSearch() {
  // If we already have a timeout scheduled, cancel it
  if (!!searchTimeout) {
    clearTimeout(searchTimeout);
    searchTimeout = null;
  }
  // Schedules a new timeout
  searchTimeout = setTimeout(searchGif, 500);
}

// Main function for the signed-in flow (already authorized by the wallet).
async function signedInFlow() {
  // Hiding sign-in html parts and showing post message things
  // $('#sign-in-container').addClass('hidden');
  $('#guest-book-container').removeClass('hidden');
  // $('#logout-option').removeClass('hidden');

  // Displaying the accountId
  $('.account-id').text(accountId);

  // Focusing on the enter message field.
  $('#text-gif-search').focus();

  // Adding handling for logging out
  $('#logout-button').click(() => {
    // It removes the auth token from the local storage.
    walletAccount.signOut();
    // Forcing redirect.
    window.location.replace(baseUrl + '/');
  })

  await initAnonId();

  // Enablid enter key to send messages as well. 
  $('#text-gif-search').keypress(function (e) {
    if (e.which == 13) {
      e.preventDefault();
      searchGif();
      return false;
    }
  }).keyup(() => {
    scheduleSearch();
  });


  initMemeEditing();
}

// Initialization code
async function init() {
  // Fetching studio/app specific config. It contains contract name and devnet url.
  contractId = nearConfig.contractName;
  baseUrl = "https://app.near.ai/" + contractId.substring(contractId.length - 9);

  // Initializing near and near client from the nearlib.
  near = await nearlib.dev.connect();

  // Getting the Account ID. If unauthorized yet, it's just empty string.
  // accountId = walletAccount.getAccountId();
  accountId = nearlib.dev.myAccountId;

  // Initializing the contract.
  // For now we need to specify method names from the contract manually.
  // It also takes the Account ID which it would use for signing transactions.
  contract = await near.loadContract(nearConfig.contractName, {
    viewMethods: ["getMeme", "getNumMemes"],
    changeMethods: ["addMeme"],
    sender: accountId,
  });

  // Initializing messages and starting auto-refreshing.
  $('#refresh-button').click(refreshMessages);
  refreshMessages();

  // Based on whether you've authorized, checking which flow we should go.
  await signedInFlow();
}

init().catch(console.log);