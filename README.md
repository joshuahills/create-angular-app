# create-angular-app

A utility to easily create an Angular application with a set of recommended tools.

## Why?

I tend to waste a lot of time setting up an Angular application. This tool creates an Angular application from a template with the following tweaks I find useful:

- ESLint with helpful rules (see [.eslintrc.json](./.eslintrc.json))
- No automatic unit test files created when running `ng generate`
- Removed the default Karma and Jasmine dependencies
- Automatically generate environment files
- Tailwind CSS
- Routing enabled
- SCSS styling

## Getting started

Run the following command and follow the prompts:

```bash
npm create @chimpbyte/angular-app
```

You'll be asked to choose a template and a variant of the template. You can choose from Angular 15 or 16 currently.
