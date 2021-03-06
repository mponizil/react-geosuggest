(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Geosuggest = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/* global window */

'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _react = (window.React);

var _react2 = _interopRequireDefault(_react);

var _GeosuggestItem = require('./GeosuggestItem');

var _GeosuggestItem2 = _interopRequireDefault(_GeosuggestItem);

// eslint-disable-line

var _inputAttributes = require('./input-attributes');

var _inputAttributes2 = _interopRequireDefault(_inputAttributes);

var Geosuggest = _react2['default'].createClass({
  displayName: 'Geosuggest',

  /**
   * Get the default props
   * @return {Object} The state
   */
  getDefaultProps: function getDefaultProps() {
    return {
      fixtures: [],
      initialValue: '',
      placeholder: 'Search places',
      disabled: false,
      className: '',
      inputClassName: '',
      location: null,
      radius: null,
      bounds: null,
      country: null,
      types: null,
      googleMaps: null,
      onSuggestSelect: function onSuggestSelect() {},
      onFocus: function onFocus() {},
      onBlur: function onBlur() {},
      onChange: function onChange() {},
      skipSuggest: function skipSuggest() {},
      getSuggestLabel: function getSuggestLabel(suggest) {
        return suggest.description;
      },
      autoActivateFirstSuggest: false
    };
  },

  /**
   * Get the initial state
   * @return {Object} The state
   */
  getInitialState: function getInitialState() {
    return {
      isMounted: false,
      isSuggestsHidden: true,
      userInput: this.props.initialValue,
      activeSuggest: null,
      suggests: []
    };
  },

  /**
   * Change inputValue if prop changes
   * @param {Object} props The new props
   */
  componentWillReceiveProps: function componentWillReceiveProps(props) {
    if (this.props.initialValue !== props.initialValue) {
      this.setState({ userInput: props.initialValue });
    }
  },

  /**
   * Called on the client side after component is mounted.
   * Google api sdk object will be obtained and cached as a instance property.
   * Necessary objects of google api will also be determined and saved.
   */
  componentDidMount: function componentDidMount() {
    this.setInputValue(this.props.initialValue);

    var googleMaps = this.props.googleMaps || window.google && // eslint-disable-line no-extra-parens
    window.google.maps || this.googleMaps;

    if (!googleMaps) {
      console.error( // eslint-disable-line no-console
      'Google map api was not found in the page.');
      return;
    }
    this.googleMaps = googleMaps;

    this.autocompleteService = new googleMaps.places.AutocompleteService();
    this.geocoder = new googleMaps.Geocoder();

    this.setState({ isMounted: true });
  },

  /**
   * When the component will unmount
   */
  componentWillUnmount: function componentWillUnmount() {
    this.setState({ isMounted: false });
  },

  /**
   * Method used for setting initial value.
   * @param {string} value to set in input
   */
  setInputValue: function setInputValue(value) {
    this.setState({ userInput: value });
  },

  /**
   * When the input got changed
   */
  onInputChange: function onInputChange() {
    var _this = this;

    var userInput = this.refs.geosuggestInput.value;

    this.setState({ userInput: userInput }, function () {
      _this.showSuggests();
      _this.props.onChange(userInput);
    });
  },

  /**
   * When the input gets focused
   */
  onFocus: function onFocus() {
    this.props.onFocus();
    this.showSuggests();
  },

  /**
   * Update the value of the user input
   * @param {String} value the new value of the user input
   */
  update: function update(value) {
    this.setState({ userInput: value });
    this.props.onChange(value);
  },

  /*
   * Clear the input and close the suggestion pane
   */
  clear: function clear() {
    var _this2 = this;

    this.setState({ userInput: '' }, function () {
      return _this2.hideSuggests();
    });
  },

  /**
   * Search for new suggests
   */
  searchSuggests: function searchSuggests() {
    var _this3 = this;

    if (!this.state.userInput) {
      this.updateSuggests();
      return;
    }

    var options = {
      input: this.state.userInput
    };

    if (this.props.location) {
      options.location = this.props.location;
    }

    if (this.props.radius) {
      options.radius = this.props.radius;
    }

    if (this.props.bounds) {
      options.bounds = this.props.bounds;
    }

    if (this.props.types) {
      options.types = this.props.types;
    }

    if (this.props.country) {
      options.componentRestrictions = {
        country: this.props.country
      };
    }

    this.autocompleteService.getPlacePredictions(options, function (suggestsGoogle) {
      _this3.updateSuggests(suggestsGoogle);

      if (_this3.props.autoActivateFirstSuggest) {
        _this3.activateSuggest('next');
      }
    });
  },

  /**
   * Update the suggests
   * @param  {Object} suggestsGoogle The new google suggests
   */
  updateSuggests: function updateSuggests(suggestsGoogle) {
    var _this4 = this;

    if (!suggestsGoogle) {
      suggestsGoogle = [];
    }

    var suggests = [],
        regex = new RegExp(this.state.userInput, 'gim'),
        skipSuggest = this.props.skipSuggest;

    this.props.fixtures.forEach(function (suggest) {
      if (!skipSuggest(suggest) && suggest.label.match(regex)) {
        suggest.placeId = suggest.label;
        suggests.push(suggest);
      }
    });

    suggestsGoogle.forEach(function (suggest) {
      if (!skipSuggest(suggest)) {
        suggests.push({
          label: _this4.props.getSuggestLabel(suggest),
          placeId: suggest.place_id
        });
      }
    });

    this.setState({ suggests: suggests });
  },

  /**
   * When the input gets focused
   */
  showSuggests: function showSuggests() {
    this.searchSuggests();
    this.setState({ isSuggestsHidden: false });
  },

  /**
   * When the input loses focused
   */
  hideSuggests: function hideSuggests() {
    var _this5 = this;

    this.props.onBlur();
    setTimeout(function () {
      if (_this5.state && _this5.state.isMounted) {
        _this5.setState({ isSuggestsHidden: true });
      }
    }, 100);
  },

  /**
   * When a key gets pressed in the input
   * @param  {Event} event The keypress event
   */
  onInputKeyDown: function onInputKeyDown(event) {
    switch (event.which) {
      case 40:
        // DOWN
        event.preventDefault();
        this.activateSuggest('next');
        break;
      case 38:
        // UP
        event.preventDefault();
        this.activateSuggest('prev');
        break;
      case 13:
        // ENTER
        event.preventDefault();
        this.selectSuggest(this.state.activeSuggest);
        break;
      case 9:
        // TAB
        this.selectSuggest(this.state.activeSuggest);
        break;
      case 27:
        // ESC
        this.hideSuggests();
        break;
      default:
        break;
    }
  },

  /**
   * Activate a new suggest
   * @param {String} direction The direction in which to activate new suggest
   */
  activateSuggest: function activateSuggest(direction) {
    // eslint-disable-line complexity
    if (this.state.isSuggestsHidden) {
      this.showSuggests();
      return;
    }

    var suggestsCount = this.state.suggests.length - 1,
        next = direction === 'next',
        newActiveSuggest = null,
        newIndex = 0,
        i = 0; // eslint-disable-line id-length

    for (i; i <= suggestsCount; i++) {
      if (this.state.suggests[i] === this.state.activeSuggest) {
        newIndex = next ? i + 1 : i - 1;
      }
    }

    if (!this.state.activeSuggest) {
      newIndex = next ? 0 : suggestsCount;
    }

    if (newIndex >= 0 && newIndex <= suggestsCount) {
      newActiveSuggest = this.state.suggests[newIndex];
    }

    this.setState({ activeSuggest: newActiveSuggest });
  },

  /**
   * When an item got selected
   * @param {GeosuggestItem} suggest The selected suggest item
   */
  selectSuggest: function selectSuggest(suggest) {
    if (!suggest) {
      suggest = {
        label: this.state.userInput
      };
    }

    this.setState({
      isSuggestsHidden: true,
      userInput: suggest.label
    });

    if (suggest.location) {
      this.props.onSuggestSelect(suggest);
      return;
    }

    this.geocodeSuggest(suggest);
  },

  /**
   * Geocode a suggest
   * @param  {Object} suggest The suggest
   */
  geocodeSuggest: function geocodeSuggest(suggest) {
    var _this6 = this;

    this.geocoder.geocode({ address: suggest.label }, function (results, status) {
      if (status !== _this6.googleMaps.GeocoderStatus.OK) {
        return;
      }

      var gmaps = results[0],
          location = gmaps.geometry.location;

      suggest.gmaps = gmaps;
      suggest.location = {
        lat: location.lat(),
        lng: location.lng()
      };

      _this6.props.onSuggestSelect(suggest);
    });
  },

  /**
   * Render the view
   * @return {Function} The React element to render
   */
  render: function render() {
    var _this7 = this;

    var attributes = {};

    _inputAttributes2['default'].forEach(function (inputAttribute) {
      if (_this7.props[inputAttribute]) {
        attributes[inputAttribute] = _this7.props[inputAttribute];
      }
    });

    return (// eslint-disable-line no-extra-parens
      _react2['default'].createElement(
        'div',
        { className: 'geosuggest ' + this.props.className,
          onClick: this.onClick },
        _react2['default'].createElement('input', _extends({
          className: 'geosuggest__input ' + this.props.inputClassName,
          ref: 'geosuggestInput',
          type: 'text'
        }, attributes, {
          value: this.state.userInput,
          onKeyDown: this.onInputKeyDown,
          onChange: this.onInputChange,
          onFocus: this.onFocus,
          onBlur: this.hideSuggests })),
        _react2['default'].createElement(
          'ul',
          { className: this.getSuggestsClasses() },
          this.getSuggestItems()
        )
      )
    );
  },

  /**
   * Get the suggest items for the list
   * @return {Array} The suggestions
   */
  getSuggestItems: function getSuggestItems() {
    return this.state.suggests.map((function (suggest) {
      var isActive = this.state.activeSuggest && suggest.placeId === this.state.activeSuggest.placeId;

      return (// eslint-disable-line no-extra-parens
        _react2['default'].createElement(_GeosuggestItem2['default'], {
          key: suggest.placeId,
          suggest: suggest,
          isActive: isActive,
          onSuggestSelect: this.selectSuggest })
      );
    }).bind(this));
  },

  /**
   * The classes for the suggests list
   * @return {String} The classes
   */
  getSuggestsClasses: function getSuggestsClasses() {
    var classes = 'geosuggest__suggests';

    classes += this.state.isSuggestsHidden ? ' geosuggest__suggests--hidden' : '';

    return classes;
  }
});

module.exports = Geosuggest;

},{"./GeosuggestItem":2,"./input-attributes":3}],2:[function(require,module,exports){
'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _react = (window.React);

var _react2 = _interopRequireDefault(_react);

var GeosuggestItem = _react2['default'].createClass({
  displayName: 'GeosuggestItem',

  /**
   * Get the default props
   * @return {Object} The props
   */
  getDefaultProps: function getDefaultProps() {
    return {
      isActive: false,
      suggest: {
        label: ''
      },
      onSuggestSelect: function onSuggestSelect() {}
    };
  },

  /**
   * When the element gets clicked
   * @param  {Event} event The click event
   */
  onClick: function onClick(event) {
    event.preventDefault();
    this.props.onSuggestSelect(this.props.suggest);
  },

  /**
   * Render the view
   * @return {Function} The React element to render
   */
  render: function render() {
    return (// eslint-disable-line no-extra-parens
      _react2['default'].createElement(
        'li',
        { className: this.getSuggestClasses(),
          onClick: this.onClick },
        this.props.suggest.label
      )
    );
  },

  /**
   * The classes for the suggest item
   * @return {String} The classes
   */
  getSuggestClasses: function getSuggestClasses() {
    var className = this.props.suggest.className;
    var classes = 'geosuggest-item';

    classes += this.props.isActive ? ' geosuggest-item--active' : '';
    classes += className ? ' ' + className : '';

    return classes;
  }
});

module.exports = GeosuggestItem;

},{}],3:[function(require,module,exports){
/**
 * Attributes allowed on input elements
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports['default'] = ['autocapitalize', 'autocomplete', 'autocorrect', 'autofocus', 'autosave', 'disabled', 'form', 'formaction', 'formenctype', 'formmethod', 'formnovalidate', 'formtarget', 'height', 'id', 'inputmode', 'maxlength', 'maxlength', 'name', 'pattern', 'placeholder', 'readonly', 'required', 'selectionDirection', 'size', 'spellcheck', 'tabindex'];
module.exports = exports['default'];

},{}]},{},[1])(1)
});