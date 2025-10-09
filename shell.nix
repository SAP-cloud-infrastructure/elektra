{ pkgs ? import <nixpkgs> { } }:

with pkgs;

mkShell {
  buildInputs = [
    bintools
    gcc
    libffi.dev
    nodejs
    postgresql
    ruby
    pnpm
  ];
}
