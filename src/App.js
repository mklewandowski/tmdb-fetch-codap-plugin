import { useEffect, useState } from 'react';
import axios from 'axios';
import { apiKey } from './Key';
import './App.css';
var codapInterface = require('./CodapInterface');

function App() {
  console.log(codapInterface);

  const [movieData, setMovieData] = useState([]);

  useEffect(() => {
    getTrendingMovieData("movie");
  }, []);

  useEffect(() => {
    getMovieDetails("movie", "238");
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

  async function getMovieDetails(type, id) {
    try {
      let resp = await axios.get(`https://api.themoviedb.org/3/${type}/${id}?api_key=${apiKey}`);
      console.log(resp.data);
    } catch (error) {

    }
  }

  const sendToCodap = (index) => {
    console.log("click: " + index);
    console.log(movieData[index].title);
    console.log(movieData[index].popularity);
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
