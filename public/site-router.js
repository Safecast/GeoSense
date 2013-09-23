define([
    'jquery',
    'underscore',
    'backbone',
    'views/featurettes-view',
    'views/user-maps-view',
    'views/data-library-dashboard-view',
    'models/map',
    'holder'
], function($, _, Backbone, FeaturettesView, UserMapsView, DataLibraryDashboardView, Map) {
        "use strict";
        var SiteRouter = Backbone.Router.extend({

            // custom routing happens in initialize()
            routes: {
                '': 'homeRoute',
                'dashboard': 'dashboardRoute',
                'login': 'focusFirstInput',
                'signup': 'focusFirstInput'
            },

            currentUser: function()
            {
                return window.USER;
            },

            focusFirstInput: function()
            {
                var $input = $('input');
                if ($input.length) {
                    $input[0].focus();
                }
            },

            initCreateMapForm: function()
            {
                var self = this,
                    $input = $('input.map-title');
                $('.create-map').on('submit', function(evt) {
                    $input.focus();
                    if (!$input.val()) {
                        $('.alert.map-title').slideDown('fast').removeClass('hidden');
                        return false;
                    };
                })

                this.focusFirstInput();
            },

            homeRoute: function() 
            {
                this.initCreateMapForm();
                var view = new FeaturettesView()
                    .render();
                $('.featurettes').append(view.$el);
                view.fetchMaps();

                this.focusFirstInput();
            },

            dashboardRoute: function() 
            {
                this.initCreateMapForm();
                var view = new UserMapsView()
                    .render();
                $('.user-maps').append(view.$el);
                view.fetchMaps();

                var view = new DataLibraryDashboardView()
                    .render();
                $('.data-collections').append(view.$el);
                view.resetPageParams().fetchResults(view.searchParams);

                this.focusFirstInput();
            },

        });

        var initialize = function() {
            window.app = new SiteRouter();
            if (!Backbone.history.start({
                pushState: true,
                root: window.BASE_URL.replace(/^(.*:\/\/)?[^\/]*\/?/, ''), // strip host and port and beginning 
                silent: false
            })) {
                $('#app').html('page not found');
            }
        };

        return {
            initialize: initialize
        };  
});