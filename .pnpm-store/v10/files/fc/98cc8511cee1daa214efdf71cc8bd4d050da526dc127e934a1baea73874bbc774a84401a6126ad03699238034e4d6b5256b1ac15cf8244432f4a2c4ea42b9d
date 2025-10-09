# postcss-minify

[PostCSS] plugin to remove comments and unnecessary whitespace from CSS files.

Input:

```css
body {
  /* make it big and red */
  font-size: large;
  color: red;
}
```

Output:

```css
body{font-size:large;color:red}
```

## Usage

Install with `npm install postcss-minify` and use [as you would any other PostCSS plugin](https://github.com/postcss/postcss#usage).

## Why

postcss-minify offers a minimalist alternative to sophisticated CSS optimizers
like [cssnano], [csso] and [clean-css]. These projects analyze your CSS and
find ways to rewrite it in order to reduce the total character count. For
example, they can merge rules with the same selector, rewrite longhand
properties using shorthand equivalents, and precompute `calc()` expressions
that evaluate to constants.

These clever techniques can help you squeeze a few more bytes out of your CSS,
but they come with a lot of complexity. You may encounter bugs in these tools
that make unsafe changes to your CSS, or find that changes which are
theoretically safe behave surprisingly in older browsers. For some projects,
the bytes saved may not be worth the risk incurred by this added complexity.

In contrast to these powerful optimizers, postcss-minify _only_ makes trivial
modifications to its input: it removes unnecessary whitespace and discards
comments. This means it can be very simple (just 50 lines of code) and carry
less risk of modifying your CSS in a way that breaks your website.

It turns out that in many situations, postcss-minify's naive approach to
minification performs almost exactly as well as much more sophisticated
techniques. Here's a quick experiment I ran where I minified [bootstrap.css]
using various CSS optimizers and then compared the pre- and post-gzip size
reductions.

|                                                      | [clean-css] | [cssnano] | [csso]    | postcss-minify |
|------------------------------------------------------|-------------|-----------|-----------|----------------|
| version tested                                       | 5.1.2       | 5.0.0     | 4.2.0     | 1.0.0          |
| lines of code (sloc)                                 | 7,170¹      | 8,159     | 2,534     | 50             |
| minified size of bootstrap.css 5.0 (195,075 bytes)   | 154,829     | 154,334   | 153,683   | 157,375        |
| ratio to unminified bootstrap.css                    | 0.794       | 0.791     | 0.788     | 0.807          |
| after gzipping minified output                       | 22,850      | 22,934    | 23,009    | 22,893         |
| ratio to gzipped bootstrap.css 5.0 (25,238 bytes)    | 0.905       | 0.909     | 0.912     | 0.907          |

As you can see, postcss-minify does almost as good a job of minifying this
large, real-world CSS file as the more complex tools. And after gzip
compression is applied to the results, the differences become insignificant.
You'd save a mere 43 bytes by using clean-css over postcss-minify,² which even
on a 2G mobile connection represents an increased download time of about 7ms.

Your mileage will vary of course. In certain situations (for example, when
minifying CSS which was generated using Sass `@mixins`), advanced techniques
will be able to substantially reduce the size of your CSS code by merging rules
and deleting duplicate declarations. But in many cases, naive minification will
get you 90% of the compression with 2% of the complexity.

1: clean-css includes its own CSS parser, while the others depend on either
postcss or css-tree. To ensure a fair comparison, I've only included the code
in the lib/optimizer/ directory of clean-css. The total codebase is about
10,125 SLOC.

2: That's about the length of this footnote.


## License

This repository is made available under the MIT license; see the included
LICENSE file for details.

[PostCSS]: https://github.com/postcss/postcss
[cssnano]: http://github.com/cssnano/cssnano
[csso]: http://github.com/css/csso
[clean-css]: https://github.com/jakubpawlowicz/clean-css
[bootstrap.css]: https://getbootstrap.com/docs/5.0/getting-started/download/
