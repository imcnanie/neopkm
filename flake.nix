{
  description = "Neopkm project with systemd service";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-23.11";
    flake-utils = {
      url = "github:numtide/flake-utils";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    neo4j = {
      url = "github:DavidRConnell/neo4j";
      inputs.nixpkgs.follows = "nixpkgs";
      inputs.flake-utils.follows = "flake-utils";
    };
  };

  outputs = { self, nixpkgs, flake-utils, neo4j, ... }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
        db-home = "/home/printer/.local/share/neo4j/example";
        auth-enabled = false;
        plugins = (with neo4j.plugins.${system}; [ gds ]);
        neo4jEnv = neo4j.packages.${system}.neo4jWrapper.override {
          inherit db-home auth-enabled plugins;
        };
        nodejs = pkgs.nodejs-18_x;
      in {
        devShell = pkgs.mkShell {
          buildInputs = [ neo4jEnv nodejs ];
          shellHook = ''
            if [ ! -d node_modules ]; then
              echo "Running npm install..."
              npm install
            fi
            if ! pgrep -x "neo4j" > /dev/null; then
              echo "Starting Neo4j..."
              neo4j start
            else
              echo "Neo4j is already running."
            fi
            echo "Development environment is ready."

          '';
        };
        defaultPackage = neo4jEnv;

   
      });
}
  
