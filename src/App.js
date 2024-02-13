import { useEffect, useState } from 'react';
import axios from 'axios';
import { apiKey } from './Key';
import './App.css';
var codapInterface = require('./CodapInterface');

var kDataSetName = 'Movies';
var kAppName = "Movies";
// The following is the initial structure of the data set that the plugin will
// refer to. It will look for it at startup and create it if not found.
var kDataSetTemplate = {
    name: "{name}",
    collections: [  // There are two collections: a parent and a child
      {
        name: 'movie_set',
        // The parent collection has just one attribute
        attrs: [ {name: "movie_set_index", type: 'categorical'}],
      },
      {
        name: 'movies',
        parent: 'movie_set',
        labels: {
          pluralCase: "movies",
          setOfCasesWithArticle: "a movie"
        },
        // The child collection has two attributes
        attrs: [{name: "title", type: 'nominal'}, {name: "popularity", type: 'numeric', precision: 1}]
      }
    ]
  };

/**
 * myState is a local copy of interactive state.
 *
 *  It is sent to CODAP on demand and restored from CODAP at initialization time.
 *
 *  @type {Object}
 */
var myState;

function App() {
  /**
   * Sends a request to CODAP for a named data context (data set)
   * @param name {string}
   * @return {Promise} of a DataContext definition.
   */
  function requestDataContext(name) {
    return codapInterface.sendRequest({
      action:'get',
      resource: 'dataContext[' + name + ']'
    });
  }

  /**
   * Sends a request to CODAP to create a Data set.
   * @param name {String}
   * @param template {Object}
   * @return {Promise} Result indicating success or failure.
   */
  function requestCreateDataSet(name, template){
    var dataSetDef = Object.assign({}, template);
    dataSetDef.name = name;
    return codapInterface.sendRequest({
      action: 'create',
      resource: 'dataContext',
      values: dataSetDef
    })
  }

  /**
   * Make a case table if there is not one already. We assume there is only one
   * case table in the CODAP document.
   *
   * @return {Promise}
   */
  function guaranteeCaseTable() {
    return new Promise(function (resolve, reject) {
      codapInterface.sendRequest({
        action: 'get',
        resource: 'componentList'
      })
      .then (function (iResult) {
        if (iResult.success) {
          // look for a case table in the list of components.
          if (iResult.values && iResult.values.some(function (component) {
                return component.type === 'caseTable'
              })) {
            resolve(iResult);
          } else {
            codapInterface.sendRequest({action: 'create', resource: 'component', values: {
              type: 'caseTable',
              dataContext: kDataSetName
            }}).then(function (result) {
              resolve(result);
            });
          }
        } else {
          reject('api error');
        }
      })
    });
  }

  /**
   * Sends an array of 'items' to CODAP.
   * @param dataSetName
   * @param items
   * @return {Promise} of status of request.
   */
  function sendItems(dataSetName, items) {
    return codapInterface.sendRequest({
      action: 'create',
      resource: 'dataContext[' + dataSetName + '].item',
      values: items
    });
  }


  /**
   * Generate a set of random numbers and send them to CODAP.
   * This is the function invoked from a button press.
   *
   */
  function sendMovieInfoToCodap (movieTitle, moviePopularity) {
    // verify we are in CODAP
    if(codapInterface.getConnectionState() !== 'active') {
      // we assume the connection should have been made by the time a button is
      // pressed.
      console.log("This page is meant to run inside of CODAP!!!");
      return;
    }

    // if a sample number has not yet been initialized, do so now.
    if (myState.sampleNumber === undefined || myState.sampleNumber === null) {
      myState.sampleNumber = 0;
    }

    var samples = [];
    var sampleIndex = myState.sampleNumber;
    // create an array of samples from movie data
    samples.push({movie_set_index: sampleIndex, title: movieTitle, popularity: moviePopularity});

    // send them
    sendItems(kDataSetName, samples);

    // open a case table if one is not already open
    guaranteeCaseTable();
  }

  const [movieData, setMovieData] = useState([]);

  useEffect(() => {
    getTrendingMovieData("movie");
  }, []);

  useEffect(() => {
    // console.log(codapInterface);
    //
    // Here we set up our relationship with CODAP
    //
    // Initialize the codapInterface: we tell it our name, dimensions, version...
    codapInterface.init({
      name: kDataSetName,
      title: kAppName,
      dimensions: {width: 420, height: 475},
      version: '0.1'
    }).then(function (iResult) {
      // get interactive state so we can save the sample set index.
      myState = codapInterface.getInteractiveState();
      // Determine if CODAP already has the Data Context we need.
      return requestDataContext(kDataSetName);
    }).then(function (iResult) {
      // if we did not find a data set, make one
      if (iResult && !iResult.success) {
        // If not not found, create it.
        return requestCreateDataSet(kDataSetName, kDataSetTemplate);
      } else {
        // else we are fine as we are, so return a resolved promise.
        return Promise.resolve(iResult);
      }
    }).catch(function (msg) {
      // handle errors
      console.log(msg);
    });

  }, []);

  async function getTrendingMovieData(type) {
    try {
      let resp = await axios.get(`https://api.themoviedb.org/3/trending/${type}/day?api_key=${apiKey}&media_type=movie`);
      console.log(resp.data.results);
      setMovieData(resp.data.results);
    } catch (error) {

    }
  }

  async function getTopRatedMovieData(type) {
    try {
      let resp = await axios.get(`https://api.themoviedb.org/3/${type}/top_rated?api_key=${apiKey}&media_type=movie`);
      console.log(resp.data.results);
      setMovieData(resp.data.results);
    } catch (error) {

    }
  }

  async function getNowPlayingMovieData(type) {
    try {
      let resp = await axios.get(`https://api.themoviedb.org/3/${type}/now_playing?api_key=${apiKey}`);
      console.log(resp.data.results);
      setMovieData(resp.data.results);
    } catch (error) {

    }
  }

  const sendToCodap = (index) => {
    console.log("click: " + index);
    console.log(movieData[index].title);
    console.log(movieData[index].popularity);
    sendMovieInfoToCodap(movieData[index].title, movieData[index].popularity);
  }

  return (
    <>
      <div className="background_container">
        <div className="button_container">
          <button onClick={() => {
            getTrendingMovieData("movie");
          }
          }>
            Trending Movies
          </button>
          <button onClick={() => {
            getTopRatedMovieData("movie");
          }
          }>
            Top Rated Movies
          </button>
          <button onClick={() => {
            getNowPlayingMovieData("movie");
          }
          }>
            Now Playing Movies
          </button>
        </div>
        <div className='flex-container'>
          {movieData.map((item, index) =>
            <div className="movie_item" key={`movie-item${index}`}>
              <img src={`https://image.tmdb.org/t/p/w300/${item.poster_path}`} alt={`title: ${item.title}`} />
              <div className="movie_name">
                {item.title}
              </div>
              <button className="movie_button" onClick={()=>{sendToCodap(index)}}>Add to CODAP</button>
            </div>
          )}
        </div>
      </div>
    </>

  );
}

export default App;
