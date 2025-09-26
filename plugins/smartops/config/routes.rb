Smartops::Engine.routes.draw do
  root to: "application#show", as: :start

  get '*path', to: 'application#show'
end
