{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  buildInputs = [
    pkgs.nodejs-18_x
  ];

  shellHook = ''
    echo "Welcome to your Node.js development environment"
    npm install
  '';
}
