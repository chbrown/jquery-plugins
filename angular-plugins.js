/*jslint browser: true */ /*globals angular, Event */
/** Copyright 2012-2014, Christopher Brown <io@henrian.com>, MIT Licensed

https://raw.github.com/chbrown/misc-js/master/angular-plugins.js

jslint with 'browser: true' really ought to recognize 'Event' as a global type

*/
angular.module('misc-js/angular-plugins', [])
// # Filters
.filter('trustHtml', function($sce) {
  /** ng-bind-html="something.html | trust" lets us easily trust something as html

  Here's how you could  completely disable SCE:

  angular.module('app', []).config(function($sceProvider) {
    $sceProvider.enabled(false);
  });

  */
  return function(string) {
    return $sce.trustAsHtml(string);
  };
})
.filter('trustResourceUrl', function($sce) {
  return function(string) {
    return $sce.trustAsResourceUrl(string);
  };
})
// # Directives
.directive('help', function() {
  /**
  <span class="help">This is a long but very useful help message but most often you probably won't want to read all of it because it's actually easy to remember and not all that helpful. Good for reference though.</span>

  This message will be truncated to the first 50 characters (TODO: make that configurable).
  */
  return {
    restrict: 'C',
    template:
      '<span class="summary" style="opacity: 0.5" ng-hide="expanded" ng-click="expanded = true"></span>' +
      '<span class="full" ng-show="expanded" ng-click="expanded = false" ng-transclude></span>',
    transclude: true,
    scope: {},
    link: function(scope, el, attrs) {
      var summary_el = el.children().eq(0);
      var full_el = el.children().eq(1);
      scope.expanded = false;

      // var content = el.text().trim();
      var content = full_el.text().trim();
      var summary = content.slice(0, 50) + ((content.length > 50) ? '...' : '');
      summary_el.text(summary);
    }
  };
})
.directive('activateCurrentAnchor', function($window, $rootScope) {
  /** This directive is also intended to be used with a <nav> element. It will
  add the class 'current' to the <a> with the closest matching href. It is
  similar to calling the following, only smarter / more adaptive.

      document.querySelector('a[href="' + window.location.pathname + '"]').classList.add('current');

  Use like:

      <nav activate-current-anchor>
        <a href="/users">Users</a>
        <a href="/products">Products</a>
        <a href="/orders">Orders</a>
      </nav>
  */
  return {
    scope: {
      activateCurrentAnchor: '@'
    },
    link: function(scope, element, attrs) {
      var className = scope.activateCurrentAnchor || 'current';
      var updateCurrent = function(anchor) {
        if (scope.current_anchor) {
          scope.current_anchor.classList.remove(className);
        }
        anchor.classList.add(className);
        scope.current_anchor = anchor;
      };
      var refresh = function() {
        var window_pathname = $window.location.pathname;
        var anchors = element.find('a');
        var i, anchor;
        // try for exact matches first
        for (i = 0; (anchor = anchors[i]); i++) {
          if (window_pathname == anchor.pathname) {
            return updateCurrent(anchor);
          }
        }
        // then for anchors with a prefix of the current url
        for (i = 0; (anchor = anchors[i]); i++) {
          if (window_pathname.indexOf(anchor.pathname) === 0) {
            return updateCurrent(anchor);
          }
        }
      };

      $rootScope.$on('$locationChangeSuccess', refresh); // function(ev, newUrl, oldUrl)
      refresh();
    }
  };
})
.directive('jsonTransform', function() {
  /** parser/serializer to edit a JSON object within a textarea or input[type=text] */
  return {
    restrict: 'A',
    require: 'ngModel',
    link: function(scope, el, attrs, ngModel) {
      // set up communicating from DOM to model
      el.on('blur keyup change', function() {
        scope.$apply(function() {
          ngModel.$setViewValue(el.val());
          // if we wanted to read from page's html before from the model, we'd
          // run this function at the link level (but usually we want the model)
        });
      });
      // set up communicating from model to DOM
      ngModel.$render = function() {
        el.val(ngModel.$viewValue);
        // this would trigger a textarea to resizeToFit, for example. kind of awkward, though.
        el[0].dispatchEvent(new Event('input'));
      };

      // set up translations
      ngModel.$formatters.push(function(value) {
        if (value === null) {
          return '';
        }
        // signature: angular.toJson(obj, [pretty]);
        return angular.toJson(value, true);
      });
      ngModel.$parsers.push(function(value) {
        // we'll interpret the empty string as 'null'
        if (value === '') {
          value = null;
        }

        try {
          ngModel.$setValidity('json', true);
          // angular uses an unwrapped JSON.parse, so it'll throw on failure
          return angular.fromJson(value);
        }
        catch (exc) {
          ngModel.$setValidity('json', false);
          // return undefined;
        }
      });
    }
  };
})
.directive('score', function() {
  /** Use like:

        <div score="match.score * 100.0">
          {{match.score.toFixed(3)}}
        </div>

    Or:

        <hr score="search_result.score * 100.0">

    This will add the class "score". I don't use restrict: 'C' because we need the score argument.

    You may want to style the element in a few ways.
    This directive only sets the border (for overflows), width, and background-color.

    For example:

        hr.score {
          height: 3px;
          box-sizing: border-box;
          border: 0;
          margin: 0;
        }

  */
  return {
    restrict: 'A',
    scope: {
      score: '='
    },
    link: function(scope, el, attrs) {
      el.addClass('score');
      // bound between 0 and 100
      var bounded_score = scope.score;
      var css = {};
      if (scope.score < 0) {
        bounded_score = 0;
        css.borderLeft = '1px dotted rgba(0, 0, 0, 0.2)';
      }
      else if (scope.score > 100) {
        bounded_score = 100;
        css.borderRight = '1px dotted black';
      }
      css.width = bounded_score + '%';
      css.backgroundColor = 'hsl(' + (bounded_score * 1.2).toFixed(2) + ', 100%, 50%)';
      el.css(css);
    }
  };
})
// .directive('time', function() {
//   /**  <time> is the HTML5 standard element
//   Use like:
//       <time datetime="user.created" class="date"></time>
//   Angular's built-in 'date' filter is very nice, though, so you likely don't need this.
//     * http://code.angularjs.org/1.2.13/docs/api/ng.filter:date
//   */
//   return {
//     restrict: 'E',
//     scope: {
//       datetime: '='
//     },
//     link: function(scope, el, attrs) {
//       var date = new Date(scope.datetime);
//       // move the actual datetime to the attribute
//       attrs.datetime = date.toISOString();
//       // and reformat the text content according to the class
//       if (el.hasClass('date')) {
//         el.text(date.toISOString().split('T')[0]);
//       }
//       else if (el.hasClass('long')) {
//         el.text(date.toString());
//       }
//       else { // default: datetime but in short iso8601
//         el.text(date.toISOString().replace(/T/, ' ').replace(/\..+/, ''));
//       }
//     }
//   };
// })
.directive('ajaxform', function($http) {
  /** Use like:

      <ajaxform method="DELETE" action="/admin/posts/{{post.id}}">
        <button>Delete</button>
      </ajaxform>

  */
  return {
    restrict: 'E',
    replace: true,
    template: '<form ng-submit="submit($event)" ng-transclude></form>',
    transclude: true,
    link: function(scope, el, attrs) {
      scope.submit = function(ev) {
        // standard html <form> can only handle POST and GET, so we hijack everything else
        if (attrs.method != 'POST' && attrs.method != 'GET') {
          ev.preventDefault();
          // var data = serializeForm(ev.target); // TODO
          $http({
            method: attrs.method,
            url: attrs.action,
            // data: data
          }).then(function(res) {
            // window.location = window.location;
          }, function() {

          });
        }
      };
    },
  };
})
.directive('mapObject', function() {
  /** Use like:

      <table map-object="result.details"></table>
  */
  return {
    restrict: 'A',
    template:
      '<table class="map">' +
      '  <tr ng-repeat="(key, val) in mapObject">' +
      '    <td ng-bind="key"></td><td ng-bind="val"></td>' +
      '  </tr>' +
      '</table>',
    replace: true,
    scope: {
      mapObject: '=',
    }
  };
})
.directive('onUpload', function($parse) {
  /** AngularJS documentation for the input directive:

  > Note: Not every feature offered is available for all input types.
  > Specifically, data binding and event handling via ng-model is
  > unsupported for input[file].

  So we have this little shim to fill in for that.

  Use like:

      <input type="file" on-upload="file = $file">

  Or:

      <input type="file" on-upload="handle($files)" multiple>

  */
  return {
    restrict: 'A',
    compile: function(el, attrs) {
      var fn = $parse(attrs.onUpload);
      return function(scope, element, attr) {
        // the element we listen to inside the link function should not be the
        // element from the compile function signature; that one may match up
        // with the linked one, but maybe not, if this element does not occur
        // directly in the DOM, e.g., if it's inside a ng-repeat or ng-if.
        element.on('change', function(event) {
          scope.$apply(function() {
            var context = {$event: event};
            if (attrs.multiple) {
              context.$files = event.target.files;
            }
            else {
              context.$file = event.target.files[0];
            }
            fn(scope, context);
          });
        });
      };
    }
  };
})
// # factories
.factory('$laghttp', function($q, $http) {
  // factories are instance generators, i.e., this function is run once and
  // should return a function that generates an instance
  return function(config) {
    var deferred = $q.defer();
    setTimeout(function() {
      $http(config).then(deferred.resolve.bind(deferred), deferred.reject.bind(deferred));
    }, 250);
    return deferred.promise;
  };
})
.factory('$httpqueue', function($q, $http) {
  var deferred = $q.defer();
  var http_queue_promise = deferred.promise;
  deferred.resolve();
  return function($http_options) {
    http_queue_promise = http_queue_promise.then(function() {
      return $http($http_options);
    });
    return http_queue_promise;
  };
});
// .config(function () {})
