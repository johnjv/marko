module.exports = require('marko/widgets').defineComponent({
    template: require.resolve('./template.marko'),
    getInitialProps: function(input, out) {
        var name = input.name;
        return {
            name: name.toUpperCase()
        };
    }
});