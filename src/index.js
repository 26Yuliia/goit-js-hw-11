import Notiflix from 'notiflix';
import './css/styles.css';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';
import Notiflix from 'notiflix';
import { Notify } from 'notiflix/build/notiflix-notify-aio';

import { createMarkup } from './js/CreateMarkup';
import { PixabayAPI } from './js/PixabayAPI';
//import { refs } from './refs';
import { notifyInit } from './js/notifyInit';
//import { spinnerPlay, spinnerStop } from './spinner';

const refs = {
  form: document.querySelector('.search-form'),
  gallery: document.querySelector('.gallery'),
  btnLoadMore: document.querySelector('.load-more'),
  backdrop: document.querySelector('.backdrop'),
  spinner: document.querySelector('.js-spinner'),
  body: document.querySelector('body'),
  btnUp: document.getElementById('to-top-btn'),
  btnUpWrapper: document.querySelector('.btn-up'),
  like: document.querySelector('.heart'),
  searchInput: document.querySelector('.search-form-input'),
};

const modalLightboxGallery = new SimpleLightbox('.gallery a', {
  captionDelay: 200,
});

export function spinnerPlay() {
  refs.body.classList.add('loading');
}

export function spinnerStop() {
  window.setTimeout(function () {
    refs.body.classList.remove('loading');
    refs.body.classList.add('loaded');
  }, 1400);
}

spinnerPlay();

window.addEventListener('load', () => {
  console.log('All resources finished loading!');

  spinnerStop();
});

//refs.btnLoadMore.classList.add('is-hidden');

const pixaby = new PixabayAPI();

const options = {
  root: null,
  rootMargin: '100px',
  threshold: 1.0,
};

const loadMorePhotos = async function (entries, observer) {
  entries.every(async entry => {
    if (entry.isIntersecting) {
      observer.unobserve(entry.target);
      pixaby.incrementPage();

      spinnerPlay();

      try {
        spinnerPlay();

        const { hits } = await pixaby.getPhotos();
        const markup = createMarkup(hits);
        refs.gallery.insertAdjacentHTML('beforeend', markup);

        const showInfo = pixaby.hasMorePhotos();
        if (pixaby.hasMorePhotos === 0) {
          const lastItem = document.querySelector('.gallery a:last-child');
          observer.observe(lastItem);
        } else
          Notify.failure(
            'Were sorry, but you have reached the end of search results.',
            notifyInit
          );

        modalLightboxGallery.refresh();
        // scrollPage();
      } catch (error) {
        Notify.failure(error.message, 'Something went wrong!', notifyInit);
        clearPage();
      } finally {
        spinnerStop();
      }
    }
  });
};

const observer = new IntersectionObserver(loadMorePhotos, options);

const onSubmitClick = async event => {
  event.preventDefault();

  const {
    elements: { searchQuery },
  } = event.target;

  const search_query = searchQuery.value.trim().toLowerCase();

  if (!search_query) {
    clearPage();
    Notify.info('Enter data to search!', notifyInit);

    refs.searchInput.placeholder = 'What`re we looking for?';
    return;
  }

  pixaby.query = search_query;

  clearPage();

  try {
    spinnerPlay();
    const { hits, total } = await pixaby.getPhotos();

    if (hits.length === 0) {
      Notify.failure(
        `Sorry, there are no images matching your ${search_query}. Please try again.`,
        notifyInit
      );

      return;
    }

    const markup = createMarkup(hits);
    refs.gallery.insertAdjacentHTML('beforeend', markup);

    pixaby.setTotal(total);
    Notify.success(`Hooray! We found ${total} images.`, notifyInit);

    if (pixaby.hasMorePhotos) {
      //refs.btnLoadMore.classList.remove('is-hidden');

      const lastItem = document.querySelector('.gallery a:last-child');
      observer.observe(lastItem);
    }

    modalLightboxGallery.refresh();
    scrollPage();
  } catch (error) {
    Notify.failure(error.message, 'Something went wrong!', notifyInit);

    clearPage();
  } finally {
    spinnerStop();
  }
};

const onLoadMore = async () => {
  pixaby.incrementPage();

  if (!pixaby.hasMorePhotos) {
    //refs.btnLoadMore.classList.add('is-hidden');
    Notify.info('Were sorry, but you have reached the end of search results.');
    notifyInit;
    refs.onLoadMore = 'none';
  }
  try {
    const { hits } = await pixaby.getPhotos();
    const markup = createMarkup(hits);
    refs.gallery.insertAdjacentHTML('beforeend', markup);

    modalLightboxGallery.refresh();
  } catch (error) {
    Notify.failure(error.message, 'Something went wrong!', notifyInit);

    clearPage();
  }
};

function clearPage() {
  pixaby.resetPage();
  refs.gallery.innerHTML = '';
  //refs.btnLoadMore.classList.add('is-hidden');
}

refs.form.addEventListener('submit', onSubmitClick);
//refs.btnLoadMore.addEventListener('click', onLoadMore);

//  smooth scrolling
function scrollPage() {
  const { height: cardHeight } = document
    .querySelector('.photo-gallery')
    .firstElementChild.getBoundingClientRect();

  window.scrollBy({
    top: cardHeight * 2,
    behavior: 'smooth',
  });
}

//Button smooth scroll up

window.addEventListener('scroll', scrollFunction);

function scrollFunction() {
  if (document.body.scrollTop > 40 || document.documentElement.scrollTop > 40) {
    refs.btnUpWrapper.style.display = 'flex';
  } else {
    refs.btnUpWrapper.style.display = 'none';
  }
}
refs.btnUp.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
