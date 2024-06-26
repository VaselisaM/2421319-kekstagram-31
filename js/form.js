import {isEscKey} from './util.js';
import {upLoadData} from './fetch.js';

const MAX_SYMBOLS = 20;
const MAX_SYMBOLS_DESCRIPTION = 140;
const MAX_HASHTAGS = 5;
const SCALE_STEP = 0.25;

const pageBody = document.querySelector('body');
const uploadForm = pageBody.querySelector('#upload-select-image');
const uploadFile = uploadForm.querySelector('.img-upload__input');
const photoEditorForm = uploadForm.querySelector('.img-upload__overlay');
const photoEditorResetButton = photoEditorForm.querySelector('#upload-cancel');
const hashtag = uploadForm.querySelector('.text__hashtags');
const description = uploadForm.querySelector('.text__description');
const uploadSubmitButton = uploadForm.querySelector('#upload-submit');
const minusButton = uploadForm.querySelector('.scale__control--smaller');
const plusButton = uploadForm.querySelector('.scale__control--bigger');
const scaleValue = uploadForm.querySelector('.scale__control--value');
const errorLoadMessage = document.querySelector('#error').content.querySelector('.error');
const successLoadMessage = document.querySelector('#success').content.querySelector('.success');
const image = uploadForm.querySelector('.img-upload__preview > img');

let errorMessage = '';
let scale = 1;

const pristine = new Pristine(uploadForm, {
  classTo: 'img-upload__field-wrapper',
  errorClass: 'img-upload__field-wrapper--error',
  successClass: 'img-upload__input',
  errorTextParent: 'img-upload__field-wrapper',
  errorTextTag: 'div',
});

const getErrorMessage = () => errorMessage;

const hashtagsHandler = (value) => {
  errorMessage = '';

  const inputText = value.toLowerCase().trim();

  if (!inputText) {
    return true;
  }

  const inputArray = inputText.split(/\s+/);

  if (inputArray.length === 0) {
    return true;
  }

  const rules = [
    {
      check: inputArray.some((item) => item[0] !== '#'),
      error: 'Хэштег должен начинаться с символа #',
    },
    {
      check: inputArray.some((item) => item.length > MAX_SYMBOLS),
      error: `Максимальная длина одного хэштега ${MAX_SYMBOLS} символов, включая решётку`,
    },
    {
      check: inputArray.some((item) => item.indexOf('#', 1) >= 1),
      error: 'Хэштеги разделяются пробелами',
    },
    {
      check: inputArray.some((item, num, arr) => arr.includes(item, num + 1)),
      error: 'Хэштег не может повторяться',
    },
    {
      check: inputArray.length > MAX_HASHTAGS,
      error: `Нельзя указать больше ${MAX_HASHTAGS} хэштегов`,
    },
    {
      check: inputArray.some((item) => item[0] === '#' && item.length === 1),
      error: 'Хэштег не может состоять только из символа #',
    },
    {
      check: inputArray.some((item) => !/^#[a-zа-яё0-9]{0,19}$/i.test(item)),
      error: 'Хэштег содержит недопустимые символы',
    },
  ];

  return rules.every((rule) => {
    const isInvalid = rule.check;
    if (isInvalid) {
      errorMessage = rule.error;
    }
    return !isInvalid;
  });
};

pristine.addValidator(hashtag, hashtagsHandler, getErrorMessage, 2, false);

const descriptionHandler = (value) => {
  errorMessage = '';

  const inputText = value;

  if (inputText.length === 0) {
    return true;
  }

  const rules = [
    {
      check: inputText.length > MAX_SYMBOLS_DESCRIPTION,
      error: `Максимальная длина комментария ${MAX_SYMBOLS_DESCRIPTION} символов`,
    },
  ];

  return rules.every((rule) => {
    const isInvalid = rule.check;
    if (isInvalid) {
      errorMessage = rule.error;
    }
    return !isInvalid;
  });
};

pristine.addValidator(description, descriptionHandler, getErrorMessage, 2, false);

const changeButtonState = () => {
  uploadSubmitButton.disabled = !pristine.validate();
};

const onHashtagInput = () => changeButtonState();

const onDescriptionInput = () => changeButtonState();

const onPhotoEditorResetButtonClick = () => closePhotoEditor();

const onClosePhotoEditorEskKeyDown = (evt) => {
  if (isEscKey(evt)) {
    const popup = document.querySelector('.popup');
    if (
      !evt.target.classList.contains('text__hashtags') &&
      !evt.target.classList.contains('text__description') &&
      !popup
    ) {
      evt.preventDefault();
      uploadForm.reset();
      closePhotoEditor();
    }
    if (popup) {
      popup.remove();
    }
  }
};

const onMinusButtonClick = () => {
  if (scale > SCALE_STEP) {
    scale -= SCALE_STEP;
    image.style.transform = `scale(${scale})`;
    scaleValue.value = `${scale * 100}%`;
  }
};

const onPlusButtonClick = () => {
  if (scale < 1) {
    scale += SCALE_STEP;
    image.style.transform = `scale(${scale})`;
    scaleValue.value = `${scale * 100}%`;
  }
};

const closePopup = () => {
  const popup = document.querySelector('.error') || document.querySelector('.success');
  popup.remove();
};

const onClosePopupClick = (evt) => {
  if(!evt.target.classList.contains('success__inner') && !evt.target.classList.contains('error__inner')) {
    evt.preventDefault();
    closePopup();
  }
};

const showMessage = (message) => {
  message.addEventListener('click', onClosePopupClick);
  document.body.appendChild(message);
};

const showErrorLoadMessage = () => {
  const messageFragment = errorLoadMessage.cloneNode(true);
  showMessage(messageFragment);
};

const showSuccessLoadMessage = () => {
  const messageFragment = successLoadMessage.cloneNode(true);
  showMessage(messageFragment);
};

function closePhotoEditor () {
  photoEditorForm.classList.add('hidden');
  pageBody.classList.remove('modal-open');
  photoEditorResetButton.removeEventListener('click', onPhotoEditorResetButtonClick);
  uploadFile.value = '';
  hashtag.value = '';
  description.value = '';
  image.style.transform = 'none';
  scale = 1;
  uploadForm.reset();
  pristine.reset();
  uploadSubmitButton.disabled = false;
}

const onSuccess = () => {
  closePhotoEditor();
  showSuccessLoadMessage();
};

const onError = () => {
  showErrorLoadMessage();
};

const initPhotoEditor = () => {
  uploadFile.addEventListener('change', () => {
    photoEditorForm.classList.remove('hidden');
    pageBody.classList.add('modal-open');
    photoEditorResetButton.addEventListener('click', onPhotoEditorResetButtonClick);
    document.addEventListener('keydown', onClosePhotoEditorEskKeyDown);
  });
};

const onUploadFormSubmit = (evt) => {
  evt.preventDefault();

  if (pristine.validate()) {
    uploadSubmitButton.disabled = true;
    upLoadData(onSuccess, onError, 'POST', new FormData(evt.target));
  }
};

hashtag.addEventListener('input', onHashtagInput);
description.addEventListener('input', onDescriptionInput);

minusButton.addEventListener('click', onMinusButtonClick);
plusButton.addEventListener('click', onPlusButtonClick);

uploadForm.addEventListener('submit', onUploadFormSubmit);

export {initPhotoEditor};
