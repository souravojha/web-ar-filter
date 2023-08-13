# RUN Only inside dist folder  
if which python3 > /dev/null
  then
  echo "python is installed"
  open http://localhost:8000
  python3 -m http.server 8000
  else
  echo "python2 not found"
fi


if which node > /dev/null
  then
  echo "node is installed"
  if which serve > /dev/null
    then
    open http://localhost:3000
    serve -s .
  else
    npm i serve -g
    open http://localhost:3000
    serve -s .
  fi
elif which python > /dev/null
  then
  echo "python is installed"
  open http://localhost:8000
  python -m http.server 8000
  else
  echo "Please install node or python to run this app"
fi

# open localhost:8000 on browser
