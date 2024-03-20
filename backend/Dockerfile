FROM python:3.9-slim-buster
WORKDIR /app
COPY ./.env /app
COPY ./tmp /app
COPY ./requirements.txt /app
COPY ./app.py /app
COPY ./model/classifier.jlb /app
RUN pip install -r requirements.txt
EXPOSE 5000
ENV FLASK_APP=app.py
CMD ["flask", "run", "--host", "0.0.0.0"]
