const fs = require('fs');
const writeStream = fs.createWriteStream('data.txt', 'UTF-8');
const axios = require('axios')
const cheerio = require('cheerio');

const url = 'https://www.imdb.com/find?s=tt&ttype=ft&ref_=fn_ft&q=';
const movieName = getInput();
let $;

axios.get(`${url}${movieName}`)
  .then(res => {
    $ = cheerio.load(res.data);
    let link;
    $('.findResult').each((index, element) => {
      if (isTitleLegal($(element).text())) {
        link = 'https://www.imdb.com' + $(element)
          .children('td')
          .children('a')
          .attr('href');
        getAndParseMovie(link);
      }
    })
  })
  .catch(err => console.log(err));

function getAndParseMovie(link) {
  let developmentMode = false;
  axios.get(link)
    .then(res => {
      $ = cheerio.load(res.data);
      developmentMode = isDevelopmentMode($);
      if (!developmentMode) {
        const title = getTitle($);
        const titleWrapper = $('.title_wrapper').children('div').text().trim().split('|');
        const raiting = getRaiting(titleWrapper);
        const duration = getDuration(titleWrapper);
        const genre = getGenre(titleWrapper);
        const plotSummary = $('.plot_summary').children('div').first().siblings().text();
        const stars = getStars(plotSummary);
        const directors = getDirectors(plotSummary);
        writeStream.write(`${title}|${genre}|${raiting}|${duration}|${directors}|${stars}\n`);
      }
    })
    .catch(err => console.log(err))
}

function getInput() {
  const indexAfterFlag = process.argv.indexOf('--search') + 1;
  return process.argv[indexAfterFlag];
}

function getRaiting(titleWrapper) {
  const str = titleWrapper[0];
  if (!str) return " ";
  const ratings = ['G', 'PG', 'PG-13', 'R', 'NC-17'];
  let raiting = " ";
  ratings.forEach(r => {
    if (r.includes(str.trim())) {
      isRaiting = true;
      raiting = r;
      titleWrapper.shift();
    }
  });
  return raiting;
}

function getDuration(titleWrapper) {
  const duration = $('.title_wrapper').children('div').children('time').text().trim();
  if (duration) {
    titleWrapper.shift();
  }
  return duration;
}

function getGenre(titleWrapper) {
  const str = titleWrapper[0];
  if (!str) return " ";
  const existingGenres = ['Documentary', 'Short', 'History', 'Biography', 'Comedy', 'Family', 'Crime', 'Drama',
    'Sport', 'Adventure', 'War', 'Mystery', 'Animation', 'Action', 'Horror', 'Sci-Fi', 'Thriller',
    'Romance', 'Fantasy', 'Musical', 'Western'];
  let isGenreExists = false;
  existingGenres.forEach(genre => {
    if (str.includes(genre)) {
      isGenreExists = true;
    }
  });
  let genres = " ";
  if (isGenreExists) {
    genres = str;
    genres = genres.trim().replace(/\n/g, '');
  }
  return genres;
}

function isDevelopmentMode($) {
  const devMode = $('#quicklinksMainSection').children('a').text();
  if (devMode.includes("IN DEVELOPMENT: MORE AT PRO")) {
    return true;
  }
  return false;
}

function getDirectors(plotSummary) {
  let [directors1, smth] = plotSummary.split('Star');
  let [directors2, smth1] = directors1.split('Writer');
  let [smth2, directors] = directors2.split('Director');
  if (!directors) {
    directors = " ";
  }
  const index = directors.indexOf(':');
  if (index !== -1) {
    directors = directors.slice(index + 1);
  }
  const indexOfPipe = directors.indexOf('|');
  if (indexOfPipe !== -1) {
    directors = directors.slice(0, indexOfPipe);
  }
  return directors.trim();
}

function getStars(plotSummary) {
  let [smth, stars] = [];
  if (plotSummary.includes('Stars:')) {
    [smth, stars] = plotSummary.split('Stars:');
  };
  if (plotSummary.includes('Star:')) {
    [smth, stars] = plotSummary.split('Star:');
  }
  if (!stars) {
    stars = " ";
  }
  const index = stars.indexOf('|');
  if (index !== -1) {
    stars = stars.slice(0, index);
  }
  return stars.trim();
}

function getTitle($) {
  let title = $('.title_wrapper').children('h1').text().trim();
  const index = title.indexOf('(');
  title = title.slice(0, index);
  return title.trim();
}

function isTitleLegal(text) {
  if (text.toLowerCase().includes(movieName.toLowerCase())) {
    return true;
  }
  return false;
}





