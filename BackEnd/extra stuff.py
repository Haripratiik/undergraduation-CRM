'''
@app.get("/") #Read from server, geting data from server, these are called Endpoints whcih can be seen using swagger
def greet():

products = [ #This lsit is supposed to come from database, but for now create a local list
    Product(id=1, name="phone", description="budget phone", price=99, quantity=10),
    Product(id=2, name="laptop", description="gaming", price=999.99, quantity=6),
    Product(id=5, name="bag", description="budget phone", price=99, quantity=10),
    Product(id=6, name="chair", description="gaming", price=999.99, quantity=6)
]

@app.get("/products") #The parameter is what comes after localhost:8000, like localhost:8000/products, specify URL
def getAllProduct():
    return products

@app.get("/product/{id}") #Curly brackets for a dynamic path, can be chnaged
def getProductById(id: int):
    for product in products:
        if product.id == id:
            return product
    return "Product not found"

@app.post("/product") #Use post to add stuff
def addProduct(product: Product): #Client adds in the details, use Swagger or React
    products.append(product)
    return products

@app.put("/product")
def updateProduct(id: int, product: Product): #To update just a field of class Product, use Patch
    for i in range(len(products)):
        if products[i].id == id:
            products[i] = product
            return "Product added successfully"

    return "product not found"

@app.delete("/product") #URL can be same, but since method is different, it is alright
def deleteProduct(id: int):
    for i in range(len(products)):
        if products[i].id == id:
            del products[i]
            return "Product deleted"
        
    return "product not found" 

'''