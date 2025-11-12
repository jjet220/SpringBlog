class FormsValidation {
  selectors = {
    form: '[data-js-form]',
    fieldErrors: '[data-js-form-field-errors]',
  }

  errorMessages = {
    valueMissing: () => 'Поле не заполнено',
    patternMismatch: ({title}) => title || 'Данные не соответствую формату',
    tooShort: ({minLength}) => `Слишком короткое значение, минимум символов - ${minLength}`,
    tooLong: ({maxLength}) => `Слишком длинное знечение, максимум символов - ${maxLength}`,
  }

  constructor() {
    this.bindEvents()
  }

  manageErrors(fieldControlElement, errorMessages) {
    const fieldErrorsElement = fieldControlElement.parentElement.querySelector(this.selectors.fieldErrors)

    fieldErrorsElement.innerHTML = errorMessages
      .map((message) => `<span class="field-error">${message}</span>`)
    .join(' ')
  }

  validateField(fieldControlElement) {
    const errors = fieldControlElement.validity;
    const errorMessages = [];

    Object.entries(this.errorMessages).forEach(([errorType,getErrorMessage]) => {
      if (errors[errorType]){
        errorMessages.push(getErrorMessage(fieldControlElement));
      }
    })

    this.manageErrors(fieldControlElement, errorMessages);

    const isValid = errorMessages.length === 0;

    fieldControlElement.ariaInvalid = !isValid

    return isValid;
  }

   onBlur(event) {
      const {target} = event;
      const isFormField = target.closest(this.selectors.form);

      if (isFormField && target.value.trim() !== '') {
        this.validateField(target);
      }
    }

  onSubmit(event) {
  const isFormElement = event.target.matches(this.selectors.form);
  if (!isFormElement) return;

  const controlElements = [...event.target.elements]
    .filter(element => element.tagName === 'INPUT' || element.tagName === 'TEXTAREA');

  let isFormValid = true;
  let firstInvalidFieldControl = null;

  controlElements.forEach((element) => {
    // Валидируем только заполненные поля
    if (element.value.trim() !== '') {
      const isFieldValid = this.validateField(element);
      if (!isFieldValid) {
        isFormValid = false;
        if (!firstInvalidFieldControl) {
          firstInvalidFieldControl = element;
        }
      }
    }
  });

    if (!isFormValid) {
      event.preventDefault();
      firstInvalidFieldControl.focus();
    }
  }

  bindEvents() {
    document.addEventListener("blur", (event) => {
      this.onBlur(event)
    }, {capture: true})
    document.addEventListener('submit', (event) => this.onSubmit(event))
  }
}

new FormsValidation();
